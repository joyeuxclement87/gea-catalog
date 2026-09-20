import { createServiceClient } from '@/lib/supabase';
import { deleteImage, STORAGE_BUCKETS, uploadImage } from '@/lib/storage';
import { getUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

type Params = { id: string; imageId: string };

async function authorized() {
  return Boolean(await getUser());
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, imageId } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = createServiceClient();

  if (body.action === 'primary') {
    const { error } = await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId)
      .eq('product_id', id);
    if (error) return NextResponse.json({ error: 'Unable to set primary image.' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === 'order') {
    const order = Number(body.display_order);
    if (!Number.isInteger(order) || order < 0 || order > 4) {
      return NextResponse.json({ error: 'Invalid image order.' }, { status: 400 });
    }
    const { error } = await supabase
      .from('product_images')
      .update({ display_order: order })
      .eq('id', imageId)
      .eq('product_id', id);
    if (error) return NextResponse.json({ error: 'Unable to reorder image.' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unsupported image action.' }, { status: 400 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, imageId } = await params;
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
  if (!new Set(['image/jpeg', 'image/png', 'image/webp']).has(file.type)) {
    return NextResponse.json({ error: 'Use JPG, PNG, or WebP images.' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Images must be 5 MB or smaller.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: current } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('id', imageId)
    .eq('product_id', id)
    .single();
  if (!current) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });

  const storagePath = `replacements/${id}/${imageId}.${file.name.split('.').pop()?.toLowerCase() ?? 'jpg'}`;
  const uploaded = await uploadImage(STORAGE_BUCKETS.products, storagePath, Buffer.from(await file.arrayBuffer()), file.type);
  if ('error' in uploaded) return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });

  const { data: image, error } = await supabase
    .from('product_images')
    .update({ image_url: uploaded.publicUrl, storage_path: uploaded.path })
    .eq('id', imageId)
    .eq('product_id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Image record could not be updated.' }, { status: 500 });

  if (current.storage_path) await deleteImage(STORAGE_BUCKETS.products, current.storage_path);
  return NextResponse.json(image);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<Params> }) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, imageId } = await params;
  const supabase = createServiceClient();
  const { data: current } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('id', imageId)
    .eq('product_id', id)
    .single();
  if (!current) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', id);
  if (error) return NextResponse.json({ error: 'Unable to delete image.' }, { status: 500 });
  if (current.storage_path) await deleteImage(STORAGE_BUCKETS.products, current.storage_path);
  return NextResponse.json({ success: true });
}
