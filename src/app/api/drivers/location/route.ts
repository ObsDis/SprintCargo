import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
        { error: 'Only drivers can update location' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { lat, lng, speed_mph, heading } = body as {
      lat: number;
      lng: number;
      speed_mph?: number;
      heading?: number;
    };

    if (lat == null || lng == null) {
      return NextResponse.json(
        { error: 'lat and lng are required' },
        { status: 400 },
      );
    }

    // Update driver_profiles current location
    const { error: updateError } = await supabase
      .from('driver_profiles')
      .update({
        current_lat: lat,
        current_lng: lng,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Location update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update location' },
        { status: 500 },
      );
    }

    // If the driver has an active job, insert a tracking point
    const activeStatuses = [
      'accepted',
      'driver_en_route_pickup',
      'at_pickup',
      'loaded',
      'in_transit',
      'at_dropoff',
    ] as const;

    const { data: activeJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('assigned_driver_id', user.id)
      .in('status', activeStatuses)
      .limit(1)
      .maybeSingle();

    if (activeJob) {
      await supabase.from('delivery_tracking').insert({
        job_id: activeJob.id,
        driver_id: user.id,
        lat,
        lng,
        speed_mph: speed_mph ?? null,
        heading: heading ?? null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/drivers/location error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
