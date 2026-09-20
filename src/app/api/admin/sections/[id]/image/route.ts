import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { deleteImage, uploadImage, STORAGE_BUCKETS } from '@/lib/storage';
import { markPdfOutdated } from '@/lib/pdf-status';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BUCKET = STORAGE_BUCKETS.sections;

type Params = { id: string };

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
  if (!MIME_TYPES.has(file.type)) return NextResponse.json({ error: 'Use JPG, PNG, or WebP images.' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Images must be 5 MB or smaller.' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: section } = await supabase.from('catalogue_sections').select('slug, image_path').eq('id', id).single();
  if (!section) return NextResponse.json({ error: 'Section not found.' }, { status: 404 });

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `${section.slug}.${ext}`;
  const uploaded = await uploadImage(BUCKET, storagePath, Buffer.from(await file.arrayBuffer()), file.type);
  if ('error' in uploaded) return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });

  const { data, error } = await supabase
    .from('catalogue_sections')
    .update({ image_url: uploaded.publicUrl, image_path: uploaded.path })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Image record could not be saved.' }, { status: 500 });

  if (section.image_path && section.image_path !== uploaded.path) {
    await deleteImage(BUCKET, section.image_path);
  }
  await markPdfOutdated();
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<Params> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: section } = await supabase.from('catalogue_sections').select('image_path').eq('id', id).single();
  if (!section) return NextResponse.json({ error: 'Section not found.' }, { status: 404 });

  if (section.image_path) await deleteImage(BUCKET, section.image_path);
  const { error } = await supabase
    .from('catalogue_sections')
    .update({ image_url: null, image_path: null })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await markPdfOutdated();
  return NextResponse.json({ success: true });
}