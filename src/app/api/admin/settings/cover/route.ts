import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { deleteImage, generateCoverImagePath, uploadImage, STORAGE_BUCKETS } from '@/lib/storage';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
  if (!MIME_TYPES.has(file.type)) return NextResponse.json({ error: 'Use JPG, PNG, or WebP images.' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Images must be 5 MB or smaller.' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: existing } = await supabase.from('catalogue_settings').select('id, cover_image_path').limit(1).maybeSingle();

  const storagePath = generateCoverImagePath(file.name);
  const uploaded = await uploadImage(STORAGE_BUCKETS.cover, storagePath, Buffer.from(await file.arrayBuffer()), file.type);
  if ('error' in uploaded) return NextResponse.json({ error: 'Cover upload failed.' }, { status: 500 });

  const record = { cover_image_url: uploaded.publicUrl, cover_image_path: uploaded.path };

  if (existing) {
    const { data, error } = await supabase
      .from('catalogue_settings')
      .update(record)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Cover record could not be saved.' }, { status: 500 });
    // Remove the previous cover from storage after a successful swap.
    if (existing.cover_image_path && existing.cover_image_path !== uploaded.path) {
      await deleteImage(STORAGE_BUCKETS.cover, existing.cover_image_path);
    }
    return NextResponse.json(data);
  }

  const { data, error } = await supabase.from('catalogue_settings').insert(record).select().single();
  if (error) return NextResponse.json({ error: 'Cover record could not be saved.' }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = createServiceClient();
  const { data: existing } = await supabase.from('catalogue_settings').select('id, cover_image_url, cover_image_path').limit(1).maybeSingle();
  if (!existing) return NextResponse.json({ success: true });

  if (existing.cover_image_path) {
    await deleteImage(STORAGE_BUCKETS.cover, existing.cover_image_path);
  }
  const { error } = await supabase
    .from('catalogue_settings')
    .update({ cover_image_url: null, cover_image_path: null })
    .eq('id', existing.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}