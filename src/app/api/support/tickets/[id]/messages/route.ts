import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ticketId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the ticket
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 },
      );
    }

    if (ticket.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this ticket' },
        { status: 403 },
      );
    }

    const { data: messages, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 },
      );
    }

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('GET /api/support/tickets/[id]/messages error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ticketId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the ticket
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id, status')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 },
      );
    }

    if (ticket.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized for this ticket' },
        { status: 403 },
      );
    }

    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Ticket is closed' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { message } = body as { message: string };

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 },
      );
    }

    const { data: newMessage, error: insertError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Message insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to add message' },
        { status: 500 },
      );
    }

    // Update ticket updated_at
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (err) {
    console.error('POST /api/support/tickets/[id]/messages error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
