import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { job_id } = body as { job_id: string };

    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 },
      );
    }

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Job must be delivered or completed
    if (!['delivered', 'completed'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Job must be delivered or completed to payout' },
        { status: 400 },
      );
    }

    if (!job.final_price || !job.assigned_driver_id) {
      return NextResponse.json(
        { error: 'Job is missing final price or assigned driver' },
        { status: 400 },
      );
    }

    if (job.stripe_transfer_id) {
      return NextResponse.json(
        { error: 'Payout already processed for this job' },
        { status: 409 },
      );
    }

    // Get driver's Connect account
    const { data: driverProfile } = await supabase
      .from('profiles')
      .select('stripe_connected_account_id')
      .eq('id', job.assigned_driver_id)
      .single();

    if (!driverProfile?.stripe_connected_account_id) {
      return NextResponse.json(
        { error: 'Driver has no connected payout account' },
        { status: 400 },
      );
    }

    // Calculate payout: amount - (amount * 0.029 + 0.30) for Stripe fees
    const grossCents = Math.round(job.final_price * 100);
    const stripeFee = Math.round(grossCents * 0.029 + 30); // 2.9% + $0.30
    const payoutCents = grossCents - stripeFee;

    if (payoutCents <= 0) {
      return NextResponse.json(
        { error: 'Payout amount too low after fees' },
        { status: 400 },
      );
    }

    const transfer = await stripe.transfers.create({
      amount: payoutCents,
      currency: 'usd',
      destination: driverProfile.stripe_connected_account_id,
      metadata: {
        job_id,
        driver_id: job.assigned_driver_id,
        gross_amount: grossCents,
        stripe_fee: stripeFee,
      },
    });

    // Update job with transfer ID
    await supabase
      .from('jobs')
      .update({
        stripe_transfer_id: transfer.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    // Notify driver
    await supabase.from('notifications').insert({
      user_id: job.assigned_driver_id,
      type: 'payment_received',
      title: 'Payment Received',
      body: `You received $${(payoutCents / 100).toFixed(2)} for job "${job.title}"`,
      data: { job_id, transfer_id: transfer.id },
    });

    return NextResponse.json({
      transfer_id: transfer.id,
      payout_amount: payoutCents / 100,
      gross_amount: grossCents / 100,
      stripe_fee: stripeFee / 100,
    });
  } catch (err) {
    console.error('POST /api/stripe/confirm-delivery-payout error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
