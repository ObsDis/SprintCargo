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
      .select('shipper_id, title')
      .eq('id', quote.job_id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify authorization
    const isShipper = profile.role === 'shipper' && job.shipper_id === user.id;
    const isDriver = profile.role === 'driver' && quote.driver_id === user.id;

    if (!isShipper && !isDriver) {
      return NextResponse.json(
        { error: 'Not authorized for this quote' },
        { status: 403 },
      );
    }

    // Only active quotes can be declined
    const declinableStatuses = [
      'pending',
      'countered_by_shipper',
      'countered_by_driver',
    ];
    if (!declinableStatuses.includes(quote.status)) {
      return NextResponse.json(
        { error: 'Quote cannot be declined in its current state' },
        { status: 400 },
      );
    }

    // Update quote
    const { data: updatedQuote, error: updateError } = await supabase
      .from('job_quotes')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      console.error('Quote decline error:', updateError);
      return NextResponse.json(
        { error: 'Failed to decline quote' },
        { status: 500 },
      );
    }

    // Notify the other party
    const notifyUserId = isShipper ? quote.driver_id : job.shipper_id;
    await supabase.from('notifications').insert({
      user_id: notifyUserId,
      type: 'quote_declined',
      title: 'Quote Declined',
      body: `A quote for "${job.title}" has been declined`,
      data: { job_id: quote.job_id, quote_id: quoteId },
    });

    return NextResponse.json({ quote: updatedQuote });
  } catch (err) {
    console.error('POST /api/quotes/[id]/decline error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
