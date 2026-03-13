import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database, SizeCategory, DeliverySpeed, Json } from '@/types/database';

// ---------------------------------------------------------------------------
// Haversine formula -- placeholder until Google Maps Distance Matrix is wired
// ---------------------------------------------------------------------------
function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Rough ETA based on avg 30 mph city driving
function estimateDurationMinutes(distanceMiles: number): number {
  return Math.ceil((distanceMiles / 30) * 60);
}

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

    // Verify shipper role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'shipper') {
      return NextResponse.json(
        { error: 'Only shippers can create jobs' },
        { status: 403 },
      );
    }

    // --- Parse body ---
    const body = await request.json();

    const {
      title,
      pickup_address,
      pickup_lat,
      pickup_lng,
      pickup_contact_name,
      pickup_contact_phone,
      pickup_notes,
      dropoff_address,
      dropoff_lat,
      dropoff_lng,
      dropoff_contact_name,
      dropoff_contact_phone,
      dropoff_notes,
      additional_stops,
      item_description,
      item_photos,
      size_category,
      estimated_weight_lbs,
      num_items,
      delivery_speed,
      pickup_window_start,
      pickup_window_end,
      special_instructions,
      fragile,
      requires_helpers,
    } = body as {
      title: string;
      pickup_address: string;
      pickup_lat: number;
      pickup_lng: number;
      pickup_contact_name: string;
      pickup_contact_phone: string;
      pickup_notes?: string;
      dropoff_address: string;
      dropoff_lat: number;
      dropoff_lng: number;
      dropoff_contact_name: string;
      dropoff_contact_phone: string;
      dropoff_notes?: string;
      additional_stops?: unknown;
      item_description: string;
      item_photos?: string[];
      size_category: SizeCategory;
      estimated_weight_lbs?: number;
      num_items?: number;
      delivery_speed?: DeliverySpeed;
      pickup_window_start: string;
      pickup_window_end: string;
      special_instructions?: string;
      fragile?: boolean;
      requires_helpers?: boolean;
    };

    // Basic validation
    if (
      !title ||
      !pickup_address ||
      pickup_lat == null ||
      pickup_lng == null ||
      !pickup_contact_name ||
      !pickup_contact_phone ||
      !dropoff_address ||
      dropoff_lat == null ||
      dropoff_lng == null ||
      !dropoff_contact_name ||
      !dropoff_contact_phone ||
      !item_description ||
      !size_category ||
      !pickup_window_start ||
      !pickup_window_end
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // --- Distance estimate ---
    const estimated_distance_miles = Math.round(
      haversineDistanceMiles(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng) *
        10,
    ) / 10;

    const estimated_duration_minutes = estimateDurationMinutes(
      estimated_distance_miles,
    );

    // --- Price estimate from nearby driver rate cards ---
    // Find drivers within a reasonable radius (50 mi) and average their rates
    const { data: rateCards } = await supabase
      .from('driver_rate_cards')
      .select('*');

    let estimated_price_low: number | null = null;
    let estimated_price_high: number | null = null;

    if (rateCards && rateCards.length > 0) {
      const prices = rateCards.map((rc) => {
        let price = rc.base_rate + estimated_distance_miles * rc.per_mile_rate;

        // Size surcharge
        const sizeKey = `size_${size_category}_surcharge` as keyof typeof rc;
        price += (rc[sizeKey] as number) ?? 0;

        // Weight surcharge
        const weight = estimated_weight_lbs ?? 0;
        if (weight > 500) price += rc.weight_over_500_surcharge;
        else if (weight > 150) price += rc.weight_150_to_500_surcharge;
        else if (weight > 50) price += rc.weight_50_to_150_surcharge;
        else price += rc.weight_under_50_surcharge;

        // Additional stops
        const numStops = Array.isArray(additional_stops)
          ? additional_stops.length
          : 0;
        price += numStops * rc.multi_stop_per_stop_rate;

        // Rush multiplier
        const speed = delivery_speed ?? 'standard';
        if (speed !== 'standard') {
          price *= rc.rush_multiplier;
        }

        return price;
      });

      prices.sort((a, b) => a - b);
      estimated_price_low = Math.round(prices[0] * 100) / 100;
      estimated_price_high =
        Math.round(prices[prices.length - 1] * 100) / 100;
    }

    // --- Insert job ---
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        shipper_id: user.id,
        status: 'posted',
        title,
        pickup_address,
        pickup_lat,
        pickup_lng,
        pickup_contact_name,
        pickup_contact_phone,
        pickup_notes: pickup_notes ?? null,
        dropoff_address,
        dropoff_lat,
        dropoff_lng,
        dropoff_contact_name,
        dropoff_contact_phone,
        dropoff_notes: dropoff_notes ?? null,
        additional_stops: (additional_stops ?? null) as Json | null,
        item_description,
        item_photos: item_photos ?? null,
        size_category,
        estimated_weight_lbs: estimated_weight_lbs ?? null,
        num_items: num_items ?? 1,
        delivery_speed: delivery_speed ?? 'standard',
        pickup_window_start,
        pickup_window_end,
        special_instructions: special_instructions ?? null,
        fragile: fragile ?? false,
        requires_helpers: requires_helpers ?? false,
        estimated_distance_miles,
        estimated_duration_minutes,
        estimated_price_low,
        estimated_price_high,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Job insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 },
      );
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error('POST /api/jobs/create error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
