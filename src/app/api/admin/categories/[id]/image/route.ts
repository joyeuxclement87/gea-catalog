import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { generateCategoryImagePath, uploadImage, STORAGE_BUCKETS } from '@/lib/storage';
import { markPdfOutdated } from '@/lib/pdf-status';
import { MAX_IMAGE_BYTES, rejectOversizedUpload } from '@/lib/upload-guard';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = MAX_IMAGE_BYTES;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type Params = { id: string };

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const tooLarge = rejectOversizedUpload(request);
  if (tooLarge) return tooLarge;
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
  if (!MIME_TYPES.has(file.type)) return NextResponse.json({ error: 'Use JPG, PNG, or WebP images.' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Images must be 4 MB or smaller.' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: category } = await supabase.from('categories').select('slug').eq('id', id).single();
  if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

  // Path is deterministic per category slug, so a fresh upload overwrites the previous file.
  const storagePath = generateCategoryImagePath(category.slug, file.name);
  const uploaded = await uploadImage(STORAGE_BUCKETS.categories, storagePath, Buffer.from(await file.arrayBuffer()), file.type);
  if ('error' in uploaded) return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });

  const { data, error } = await supabase
    .from('categories')
    .update({ image: uploaded.publicUrl })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Image record could not be saved.' }, { status: 500 });
  await markPdfOutdated();
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<Params> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: category } = await supabase.from('categories').select('image').eq('id', id).single();
  if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

  const { error } = await supabase.from('categories').update({ image: null }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await markPdfOutdated();
  return NextResponse.json({ success: true });
}