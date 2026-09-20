import { createServiceClient } from '@/lib/supabase';
import { deleteImage, STORAGE_BUCKETS, uploadImage } from '@/lib/storage';
import { getUser } from '@/lib/auth';
import { markPdfOutdated } from '@/lib/pdf-status';
import { MAX_IMAGE_BYTES, rejectOversizedUpload } from '@/lib/upload-guard';
import { logActivity } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';

type Params = { id: string; imageId: string };

async function authorized() {
  return Boolean(await getUser());
}

/** Product name for the image's parent product (media audit context). */
async function productNameForImage(supabase: ReturnType<typeof createServiceClient>, id: string, imageId: string): Promise<string | null> {
  const { data } = await supabase
    .from('product_images')
    .select('product:products(name)')
    .eq('id', imageId)
    .eq('product_id', id)
    .maybeSingle();
  const name = (data as { product?: { name?: string | null } } | null)?.product?.name;
  return name ?? null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, imageId } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = createServiceClient();
  const productName = await productNameForImage(supabase, id, imageId);

  if (body.action === 'primary') {
    const { error } = await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId)
      .eq('product_id', id);
    if (error) return NextResponse.json({ error: 'Unable to set primary image.' }, { status: 500 });
    await markPdfOutdated();
    await logActivity({
      action: 'media.reordered',
      entityType: 'media',
      entityId: imageId,
      entityName: productName,
      description: `Set the primary image for “${productName}”.`,
      metadata: { product_id: id, change: 'primary' },
    });
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
    await markPdfOutdated();
    await logActivity({
      action: 'media.reordered',
      entityType: 'media',
      entityId: imageId,
      entityName: productName,
      description: `Reordered product images for “${productName}”.`,
      metadata: { product_id: id, change: 'order', display_order: order },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unsupported image action.' }, { status: 400 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, imageId } = await params;
  const tooLarge = rejectOversizedUpload(request);
  if (tooLarge) return tooLarge;
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
  if (!new Set(['image/jpeg', 'image/png', 'image/webp']).has(file.type)) {
    return NextResponse.json({ error: 'Use JPG, PNG, or WebP images.' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Images must be 4 MB or smaller.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: current } = await supabase
    .from('product_images')
    .select('storage_path, product:products(name)')
    .eq('id', imageId)
    .eq('product_id', id)
    .single();
  if (!current) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });

  const productName = (current as unknown as { product?: { name?: string | null } })?.product?.name ?? null;

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
  await markPdfOutdated();
  await logActivity({
    action: 'media.replaced',
    entityType: 'media',
    entityId: imageId,
    entityName: productName,
    description: `Replaced a product image for “${productName}”.`,
    metadata: { product_id: id, image_url: image.image_url },
  });
  return NextResponse.json(image);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<Params> }) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, imageId } = await params;
  const supabase = createServiceClient();
  const { data: current } = await supabase
    .from('product_images')
    .select('storage_path, product:products(name)')
    .eq('id', imageId)
    .eq('product_id', id)
    .single();
  if (!current) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });

  const productName = (current as unknown as { product?: { name?: string | null } })?.product?.name ?? null;

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', id);
  if (error) return NextResponse.json({ error: 'Unable to delete image.' }, { status: 500 });
  if (current.storage_path) await deleteImage(STORAGE_BUCKETS.products, current.storage_path);
  await markPdfOutdated();
  await logActivity({
    action: 'media.deleted',
    entityType: 'media',
    entityId: imageId,
    entityName: productName,
    description: `Deleted a product image for “${productName}”.`,
    metadata: { product_id: id },
  });
  return NextResponse.json({ success: true });
}
