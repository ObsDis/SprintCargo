import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { JobStatus } from '@/types/database';

// Allowed status transitions and who may perform them
const ALLOWED_TRANSITIONS: Record<
  string,
  { to: JobStatus; by: 'shipper' | 'driver' }
> = {
  'posted→cancelled': { to: 'cancelled', by: 'shipper' },
  'accepted→driver_en_route_pickup': {
    to: 'driver_en_route_pickup',
    by: 'driver',
  },
  'driver_en_route_pickup→at_pickup': { to: 'at_pickup', by: 'driver' },
  'at_pickup→loaded': { to: 'loaded', by: 'driver' },
  'loaded→in_transit': { to: 'in_transit', by: 'driver' },
  'in_transit→at_dropoff': { to: 'at_dropoff', by: 'driver' },
  'at_dropoff→delivered': { to: 'delivered', by: 'driver' },
  'delivered→completed': { to: 'completed', by: 'shipper' }, // or auto after 24 h
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();

    // --- Auth ---
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status: newStatus, cancellation_reason } = body as {
      status: JobStatus;
      cancellation_reason?: string;
    };

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Missing status field' },
        { status: 400 },
      );
    }

    // Fetch current job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Determine user role for this job
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

    // Validate the user is associated with this job
    if (
      profile.role === 'shipper' &&
      job.shipper_id !== user.id
    ) {
      return NextResponse.json(
        { error: 'Not your job' },
        { status: 403 },
      );
    }

    if (
      profile.role === 'driver' &&
      job.assigned_driver_id !== user.id
    ) {
      return NextResponse.json(
        { error: 'Not assigned to this job' },
        { status: 403 },
      );
    }

    // Validate transition
    const transitionKey = `${job.status}→${newStatus}`;
    const rule = ALLOWED_TRANSITIONS[transitionKey];

    if (!rule) {
      return NextResponse.json(
        {
          error: `Invalid status transition from '${job.status}' to '${newStatus}'`,
        },
        { status: 400 },
      );
    }

    if (rule.by !== profile.role) {
      return NextResponse.json(
        {
          error: `Only a ${rule.by} can perform this transition`,
        },
        { status: 403 },
      );
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'cancelled') {
      updatePayload.cancelled_at = new Date().toISOString();
      updatePayload.cancelled_by = user.id;
      updatePayload.cancellation_reason = cancellation_reason ?? null;
    }

    if (newStatus === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Job status update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update job status' },
        { status: 500 },
      );
    }

    return NextResponse.json({ job: updatedJob });
  } catch (err) {
    console.error('PATCH /api/jobs/[id]/status error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
