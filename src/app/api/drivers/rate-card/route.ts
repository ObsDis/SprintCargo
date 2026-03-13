import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers have rate cards' },
        { status: 403 },
      );
    }

    const { data: rateCard, error } = await supabase
      .from('driver_rate_cards')
      .select('*')
      .eq('driver_id', user.id)
      .single();

    if (error || !rateCard) {
      return NextResponse.json(
        { error: 'Rate card not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ rate_card: rateCard });
  } catch (err) {
    console.error('GET /api/drivers/rate-card error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers can update rate cards' },
        { status: 403 },
      );
    }

    const body = await request.json();

    const allowedFields = [
      'base_rate',
      'per_mile_rate',
      'size_small_surcharge',
      'size_medium_surcharge',
      'size_large_surcharge',
      'size_oversized_surcharge',
      'weight_under_50_surcharge',
      'weight_50_to_150_surcharge',
      'weight_150_to_500_surcharge',
      'weight_over_500_surcharge',
      'multi_stop_per_stop_rate',
      'rush_multiplier',
    ] as const;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (field in body && typeof body[field] === 'number' && body[field] >= 0) {
        updatePayload[field] = body[field];
      }
    }

    // Check if rate card exists -- upsert
    const { data: existing } = await supabase
      .from('driver_rate_cards')
      .select('id')
      .eq('driver_id', user.id)
      .maybeSingle();

    let rateCard;
    let error;

    if (existing) {
      const result = await supabase
        .from('driver_rate_cards')
        .update(updatePayload)
        .eq('driver_id', user.id)
        .select()
        .single();
      rateCard = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('driver_rate_cards')
        .insert({ driver_id: user.id, ...updatePayload })
        .select()
        .single();
      rateCard = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Rate card upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to update rate card' },
        { status: 500 },
      );
    }

    return NextResponse.json({ rate_card: rateCard });
  } catch (err) {
    console.error('PUT /api/drivers/rate-card error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
