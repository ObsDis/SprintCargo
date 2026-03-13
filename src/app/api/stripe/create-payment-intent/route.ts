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

    // Only shipper can pay
    if (job.shipper_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the shipper can create a payment' },
        { status: 403 },
      );
    }

    if (!job.final_price) {
      return NextResponse.json(
        { error: 'Job has no final price set' },
        { status: 400 },
      );
    }

    // Get or create Stripe customer for shipper
    const { data: shipperProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = shipperProfile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? shipperProfile?.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Amount in cents
    const amountCents = Math.round(job.final_price * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        job_id,
        shipper_id: user.id,
        driver_id: job.assigned_driver_id ?? '',
      },
    });

    // Store payment intent ID on job
    await supabase
      .from('jobs')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (err) {
    console.error('POST /api/stripe/create-payment-intent error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
