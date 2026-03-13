import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: quoteId } = await params;
    const supabase = await createClient();

    // --- Auth ---
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 },
      );
    }

    // Fetch quote
    const { data: quote, error: quoteError } = await supabase
      .from('job_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Fetch job to verify association
    const { data: job } = await supabase
      .from('jobs')
      .select('shipper_id, title')
      .eq('id', quote.job_id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify the user is the shipper or the driver on this quote
    const isShipper = profile.role === 'shipper' && job.shipper_id === user.id;
    const isDriver = profile.role === 'driver' && quote.driver_id === user.id;

    if (!isShipper && !isDriver) {
      return NextResponse.json(
        { error: 'Not authorized for this quote' },
        { status: 403 },
      );
    }

    // Validate quote is in a counterable state
    const counterableStatuses = [
      'pending',
      'countered_by_shipper',
      'countered_by_driver',
    ];
    if (!counterableStatuses.includes(quote.status)) {
      return NextResponse.json(
        { error: 'Quote cannot be countered in its current state' },
        { status: 400 },
      );
    }

    // Check negotiation round
    if (quote.negotiation_round >= 2) {
      return NextResponse.json(
        { error: 'Maximum negotiation rounds (2) reached' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { amount, note } = body as { amount: number; note?: string };

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid counter amount is required' },
        { status: 400 },
      );
    }

    // Build update
    const updatePayload: Record<string, unknown> = {
      negotiation_round: quote.negotiation_round + 1,
      updated_at: new Date().toISOString(),
    };

    if (isShipper) {
      updatePayload.shipper_counter_amount = amount;
      updatePayload.shipper_counter_note = note ?? null;
      updatePayload.status = 'countered_by_shipper';
    } else {
      updatePayload.driver_counter_amount = amount;
      updatePayload.driver_counter_note = note ?? null;
      updatePayload.status = 'countered_by_driver';
    }

    const { data: updatedQuote, error: updateError } = await supabase
      .from('job_quotes')
      .update(updatePayload)
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      console.error('Counter update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update quote' },
        { status: 500 },
      );
    }

    // Notify the other party
    const notifyUserId = isShipper ? quote.driver_id : job.shipper_id;
    await supabase.from('notifications').insert({
      user_id: notifyUserId,
      type: 'counter_offer',
      title: 'Counter Offer Received',
      body: `A counter offer of $${amount.toFixed(2)} was made for "${job.title}"`,
      data: { job_id: quote.job_id, quote_id: quoteId },
    });

    return NextResponse.json({ quote: updatedQuote });
  } catch (err) {
    console.error('POST /api/quotes/[id]/counter error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
