import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SizeCategory, DeliverySpeed } from '@/types/database';

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

    // Verify driver role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers can calculate quotes' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      distance_miles,
      size_category,
      estimated_weight_lbs,
      num_additional_stops,
      delivery_speed,
    } = body as {
      distance_miles: number;
      size_category: SizeCategory;
      estimated_weight_lbs?: number;
      num_additional_stops?: number;
      delivery_speed?: DeliverySpeed;
    };

    if (distance_miles == null || !size_category) {
      return NextResponse.json(
        { error: 'distance_miles and size_category are required' },
        { status: 400 },
      );
    }

    // Fetch driver's rate card
    const { data: rateCard, error: rcError } = await supabase
      .from('driver_rate_cards')
      .select('*')
      .eq('driver_id', user.id)
      .single();

    if (rcError || !rateCard) {
      return NextResponse.json(
        { error: 'Rate card not found. Please set up your rate card first.' },
        { status: 404 },
      );
    }

    // Formula:
    // base_rate
    // + (distance * per_mile_rate)
    // + size_surcharge
    // + weight_surcharge
    // + (num_additional_stops * multi_stop_per_stop_rate)
    // all * rush_multiplier if not standard

    let total = rateCard.base_rate + distance_miles * rateCard.per_mile_rate;

    // Size surcharge
    const sizeKey = `size_${size_category}_surcharge` as keyof typeof rateCard;
    total += (rateCard[sizeKey] as number) ?? 0;

    // Weight surcharge
    const weight = estimated_weight_lbs ?? 0;
    if (weight > 500) total += rateCard.weight_over_500_surcharge;
    else if (weight > 150) total += rateCard.weight_150_to_500_surcharge;
    else if (weight > 50) total += rateCard.weight_50_to_150_surcharge;
    else total += rateCard.weight_under_50_surcharge;

    // Additional stops
    const stops = num_additional_stops ?? 0;
    total += stops * rateCard.multi_stop_per_stop_rate;

    // Rush multiplier
    const speed = delivery_speed ?? 'standard';
    if (speed !== 'standard') {
      total *= rateCard.rush_multiplier;
    }

    total = Math.round(total * 100) / 100;

    return NextResponse.json({
      calculated_amount: total,
      breakdown: {
        base_rate: rateCard.base_rate,
        distance_charge: Math.round(distance_miles * rateCard.per_mile_rate * 100) / 100,
        size_surcharge: (rateCard[sizeKey] as number) ?? 0,
        weight_surcharge:
          weight > 500
            ? rateCard.weight_over_500_surcharge
            : weight > 150
              ? rateCard.weight_150_to_500_surcharge
              : weight > 50
                ? rateCard.weight_50_to_150_surcharge
                : rateCard.weight_under_50_surcharge,
        multi_stop_charge: Math.round(stops * rateCard.multi_stop_per_stop_rate * 100) / 100,
        rush_multiplier: speed !== 'standard' ? rateCard.rush_multiplier : 1,
      },
    });
  } catch (err) {
    console.error('POST /api/drivers/calculate-quote error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
