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

    // Fetch job
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', quote.job_id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Determine who can accept
    const isShipper = profile.role === 'shipper' && job.shipper_id === user.id;
    const isDriver = profile.role === 'driver' && quote.driver_id === user.id;

    if (!isShipper && !isDriver) {
      return NextResponse.json(
        { error: 'Not authorized for this quote' },
        { status: 403 },
      );
    }

    // Shipper can accept pending / countered_by_driver quotes
    // Driver can accept countered_by_shipper quotes
    const acceptableByShipper = ['pending', 'countered_by_driver'];
    const acceptableByDriver = ['countered_by_shipper'];

    if (isShipper && !acceptableByShipper.includes(quote.status)) {
      return NextResponse.json(
        { error: 'Quote cannot be accepted in its current state' },
        { status: 400 },
      );
    }

    if (isDriver && !acceptableByDriver.includes(quote.status)) {
      return NextResponse.json(
        { error: 'Quote cannot be accepted in its current state' },
        { status: 400 },
      );
    }

    // Determine the final price
    let finalPrice: number;

    if (isShipper) {
      // Shipper accepts: use the latest offer
      finalPrice =
        quote.driver_counter_amount ?? quote.amount;
    } else {
      // Driver accepts shipper's counter
      finalPrice = quote.shipper_counter_amount!;
    }

    // Update quote status
    const { error: quoteUpdateError } = await supabase
      .from('job_quotes')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (quoteUpdateError) {
      console.error('Quote accept error:', quoteUpdateError);
      return NextResponse.json(
        { error: 'Failed to accept quote' },
        { status: 500 },
      );
    }

    // Decline all other pending quotes for this job
    await supabase
      .from('job_quotes')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('job_id', quote.job_id)
      .neq('id', quoteId)
      .in('status', ['pending', 'countered_by_shipper', 'countered_by_driver']);

    // Update job: assign driver, set final price, set accepted quote
    const { data: updatedJob, error: jobUpdateError } = await supabase
      .from('jobs')
      .update({
        status: 'accepted',
        accepted_quote_id: quoteId,
        assigned_driver_id: quote.driver_id,
        final_price: finalPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quote.job_id)
      .select()
      .single();

    if (jobUpdateError) {
      console.error('Job update error:', jobUpdateError);
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 },
      );
    }

    // Placeholder: create PaymentIntent (will be done via /api/stripe/create-payment-intent)

    // Notify both parties
    const notifications = [
      {
        user_id: job.shipper_id,
        type: 'quote_accepted' as const,
        title: 'Quote Accepted',
        body: `The quote for "${job.title}" has been accepted at $${finalPrice.toFixed(2)}`,
        data: { job_id: quote.job_id, quote_id: quoteId },
      },
      {
        user_id: quote.driver_id,
        type: 'quote_accepted' as const,
        title: 'Quote Accepted',
        body: `Your quote for "${job.title}" has been accepted at $${finalPrice.toFixed(2)}`,
        data: { job_id: quote.job_id, quote_id: quoteId },
      },
    ];

    // Filter out duplicate if shipper === the acceptor -- still notify the driver
    const uniqueNotifications = notifications.filter(
      (n, i, arr) =>
        arr.findIndex((x) => x.user_id === n.user_id) === i,
    );

    await supabase.from('notifications').insert(uniqueNotifications);

    return NextResponse.json({
      quote: { id: quoteId, status: 'accepted' },
      job: updatedJob,
      final_price: finalPrice,
    });
  } catch (err) {
    console.error('POST /api/quotes/[id]/accept error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
