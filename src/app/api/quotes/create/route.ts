import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // --- Auth ---
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify driver role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers can submit quotes' },
        { status: 403 },
      );
    }

    // Verify active subscription
    if (
      !['active', 'trial'].includes(profile.subscription_status)
    ) {
      return NextResponse.json(
        { error: 'Active subscription required to submit quotes' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      job_id,
      amount,
      driver_note,
      estimated_pickup_eta_minutes,
    } = body as {
      job_id: string;
      amount?: number;
      driver_note?: string;
      estimated_pickup_eta_minutes?: number;
    };

    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 },
      );
    }

    // Check job exists and is quotable
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!['posted', 'quoted'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Job is no longer accepting quotes' },
        { status: 400 },
      );
    }

    // Check no existing quote from this driver for this job
    const { data: existingQuote } = await supabase
      .from('job_quotes')
      .select('id')
      .eq('job_id', job_id)
      .eq('driver_id', user.id)
      .not('status', 'in', '("declined","expired","withdrawn")')
      .maybeSingle();

    if (existingQuote) {
      return NextResponse.json(
        { error: 'You already have an active quote for this job' },
        { status: 409 },
      );
    }

    // Calculate auto amount from rate card
    const { data: rateCard } = await supabase
      .from('driver_rate_cards')
      .select('*')
      .eq('driver_id', user.id)
      .single();

    let autoAmount: number | null = null;

    if (rateCard && job.estimated_distance_miles != null) {
      let calc = rateCard.base_rate +
        job.estimated_distance_miles * rateCard.per_mile_rate;

      // Size surcharge
      const sizeKey = `size_${job.size_category}_surcharge` as keyof typeof rateCard;
      calc += (rateCard[sizeKey] as number) ?? 0;

      // Weight surcharge
      const weight = job.estimated_weight_lbs ?? 0;
      if (weight > 500) calc += rateCard.weight_over_500_surcharge;
      else if (weight > 150) calc += rateCard.weight_150_to_500_surcharge;
      else if (weight > 50) calc += rateCard.weight_50_to_150_surcharge;
      else calc += rateCard.weight_under_50_surcharge;

      // Additional stops
      const numStops = Array.isArray(job.additional_stops)
        ? job.additional_stops.length
        : 0;
      calc += numStops * rateCard.multi_stop_per_stop_rate;

      // Rush multiplier
      if (job.delivery_speed !== 'standard') {
        calc *= rateCard.rush_multiplier;
      }

      autoAmount = Math.round(calc * 100) / 100;
    }

    const quoteAmount = amount ?? autoAmount;

    if (quoteAmount == null || quoteAmount <= 0) {
      return NextResponse.json(
        { error: 'Could not determine quote amount. Provide an amount.' },
        { status: 400 },
      );
    }

    // 30-minute expiration
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: quote, error: insertError } = await supabase
      .from('job_quotes')
      .insert({
        job_id,
        driver_id: user.id,
        amount: quoteAmount,
        auto_calculated_amount: autoAmount,
        driver_note: driver_note ?? null,
        status: 'pending',
        negotiation_round: 0,
        estimated_pickup_eta_minutes: estimated_pickup_eta_minutes ?? null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Quote insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create quote' },
        { status: 500 },
      );
    }

    // Update job status to 'quoted' if this is the first quote
    if (job.status === 'posted') {
      await supabase
        .from('jobs')
        .update({ status: 'quoted', updated_at: new Date().toISOString() })
        .eq('id', job_id);
    }

    // Create notification for shipper
    await supabase.from('notifications').insert({
      user_id: job.shipper_id,
      type: 'new_quote',
      title: 'New Quote Received',
      body: `A driver submitted a quote of $${quoteAmount.toFixed(2)} for "${job.title}"`,
      data: { job_id, quote_id: quote.id },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    console.error('POST /api/quotes/create error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
