import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request.nextUrl;
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const offset = (page - 1) * limit;

    const { data: tickets, error, count } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Tickets fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      tickets,
      pagination: { page, limit, total: count ?? 0 },
    });
  } catch (err) {
    console.error('GET /api/support/tickets error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

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
    const { subject, message, job_id } = body as {
      subject: string;
      message: string;
      job_id?: string;
    };

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'subject and message are required' },
        { status: 400 },
      );
    }

    const { data: ticket, error: insertError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        message,
        job_id: job_id ?? null,
        status: 'open',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Ticket insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    console.error('POST /api/support/tickets error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
