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

    const body = await request.json();
    const { job_id, reviewed_id, rating, comment } = body as {
      job_id: string;
      reviewed_id: string;
      rating: number;
      comment?: string;
    };

    if (!job_id || !reviewed_id || rating == null) {
      return NextResponse.json(
        { error: 'job_id, reviewed_id, and rating are required' },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 },
      );
    }

    // Verify job is completed
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!['delivered', 'completed'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Can only review completed or delivered jobs' },
        { status: 400 },
      );
    }

    // Verify the reviewer is associated with the job
    if (job.shipper_id !== user.id && job.assigned_driver_id !== user.id) {
      return NextResponse.json(
        { error: 'Not associated with this job' },
        { status: 403 },
      );
    }

    // Verify the reviewed person is the other party
    if (
      (job.shipper_id === user.id && reviewed_id !== job.assigned_driver_id) ||
      (job.assigned_driver_id === user.id && reviewed_id !== job.shipper_id)
    ) {
      return NextResponse.json(
        { error: 'Invalid reviewed_id for this job' },
        { status: 400 },
      );
    }

    // Check no existing review from this user for this job
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('job_id', job_id)
      .eq('reviewer_id', user.id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this job' },
        { status: 409 },
      );
    }

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        job_id,
        reviewer_id: user.id,
        reviewed_id,
        rating,
        comment: comment ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Review insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 },
      );
    }

    // Recalculate driver rating if reviewed_id is the driver
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', reviewed_id)
      .single();

    if (profile?.role === 'driver') {
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', reviewed_id);

      if (allReviews && allReviews.length > 0) {
        const avg =
          allReviews.reduce((sum, r) => sum + r.rating, 0) /
          allReviews.length;
        const rounded = Math.round(avg * 10) / 10;

        await supabase
          .from('driver_profiles')
          .update({ rating: rounded })
          .eq('id', reviewed_id);
      }
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error('POST /api/reviews/create error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
