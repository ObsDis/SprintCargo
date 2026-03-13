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
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') ?? '20', 10),
      100,
    );
    const offset = (page - 1) * limit;

    // Fetch notifications
    const { data: notifications, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Notifications fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 },
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      notifications,
      unread_count: unreadCount ?? 0,
      pagination: { page, limit, total: count ?? 0 },
    });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
