import { createServiceClient } from '@/lib/supabase';
import { generateProductImagePath, STORAGE_BUCKETS, uploadImage } from '@/lib/storage';
import { getUser } from '@/lib/auth';
import { markPdfOutdated } from '@/lib/pdf-status';
import { NextRequest, NextResponse } from 'next/server';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type Params = { id: string };

export async function GET(_request: NextRequest, { params }: { params: Promise<Params> }) {
  if (!(await getUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', id)
    .order('display_order', { ascending: true });

  if (error) return NextResponse.json({ error: 'Unable to load product images.' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  if (!(await getUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
  if (!MIME_TYPES.has(file.type)) return NextResponse.json({ error: 'Use JPG, PNG, or WebP images.' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Images must be 5 MB or smaller.' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: existingData, error: countError } = await supabase
    .from('product_images')
    .select('id, display_order, is_primary')
    .eq('product_id', id);
  const existing = (existingData ?? []) as { id: string; display_order: number; is_primary: boolean }[];
  if (countError) return NextResponse.json({ error: 'Unable to check image limit.' }, { status: 500 });
  if ((existing?.length ?? 0) >= MAX_IMAGES) {
    return NextResponse.json({ error: 'Maximum 5 images per product.' }, { status: 409 });
  }

  const { data: product } = await supabase.from('products').select('slug').eq('id', id).single();
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  const storagePath = generateProductImagePath(`${product.slug}/${crypto.randomUUID()}`, file.name);
  const uploaded = await uploadImage(STORAGE_BUCKETS.products, storagePath, Buffer.from(await file.arrayBuffer()), file.type);
  if ('error' in uploaded) return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });

  const shouldBePrimary = existing?.length === 0 || formData.get('is_primary') === 'true';
  const nextOrder = existing?.reduce((max, image) => Math.max(max, image.display_order), -1) + 1;
  const { data: image, error } = await supabase
    .from('product_images')
    .insert({
      product_id: id,
      image_url: uploaded.publicUrl,
      storage_path: uploaded.path,
      display_order: nextOrder,
      is_primary: shouldBePrimary,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Image record could not be saved.' }, { status: 500 });
  await markPdfOutdated();
  return NextResponse.json(image, { status: 201 });
}
