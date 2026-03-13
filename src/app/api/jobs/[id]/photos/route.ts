import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Only the assigned driver can upload photos
    if (job.assigned_driver_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the assigned driver can upload photos' },
        { status: 403 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const photoType = formData.get('type') as string | null; // 'loading' | 'delivery'
    const files = formData.getAll('files') as File[];

    if (!photoType || !['loading', 'delivery'].includes(photoType)) {
      return NextResponse.json(
        { error: 'type must be "loading" or "delivery"' },
        { status: 400 },
      );
    }

    if (!files.length) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 },
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop() ?? 'jpg';
      const filePath = `${jobId}/${photoType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(filePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('delivery-photos').getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    if (!uploadedUrls.length) {
      return NextResponse.json(
        { error: 'All file uploads failed' },
        { status: 500 },
      );
    }

    // Update job photo arrays
    const column =
      photoType === 'loading' ? 'loading_photos' : 'delivery_photos';
    const existingPhotos =
      (job[column as keyof typeof job] as string[] | null) ?? [];
    const updatedPhotos = [...existingPhotos, ...uploadedUrls];

    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        [column]: updatedPhotos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Job photo update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update job photos' },
        { status: 500 },
      );
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 201 });
  } catch (err) {
    console.error('POST /api/jobs/[id]/photos error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
