import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { markPdfOutdated } from '@/lib/pdf-status';
import { diffRecord, logActivity } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const supabase = createServiceClient();
  const { id } = await params;
  const body = await request.json();

  const { data: existing } = await supabase.from('products').select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const changes = diffRecord(existing, body);

  const { data, error } = await supabase
    .from('products')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    await logActivity({
      action: 'product.updated',
      entityType: 'product',
      entityId: id,
      entityName: existing.name ?? null,
      description: `Updating product “${existing.name}” failed.`,
      metadata: { error: error.message },
      status: 'failed',
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await markPdfOutdated();

  const statusChanged = changes.status && existing.status !== body.status;
  const onlyCategoryChanged =
    Object.keys(changes).length === 1 && changes.category_id !== undefined;

  let action: string;
  if (statusChanged && body.status === 'published') action = 'product.published';
  else if (statusChanged && body.status === 'draft') action = 'product.unpublished';
  else if (onlyCategoryChanged) action = 'product.category_changed';
  else action = 'product.updated';

  await logActivity({
    action,
    entityType: 'product',
    entityId: id,
    entityName: data.name,
    description: action === 'product.updated'
      ? `Updated product “${data.name}”.`
      : action === 'product.category_changed'
        ? `Changed the category of product “${data.name}”.`
        : `Product “${data.name}” ${body.status === 'published' ? 'published' : 'unpublished'}.`,
    metadata: Object.keys(changes).length > 0 ? { changes } : null,
  });

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const supabase = createServiceClient();
  const { id } = await params;

  const { data: existing } = await supabase.from('products').select('name, slug, category_id').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    await logActivity({
      action: 'product.deleted',
      entityType: 'product',
      entityId: id,
      entityName: existing.name ?? null,
      description: `Deleting product “${existing.name}” failed.`,
      metadata: { error: error.message },
      status: 'failed',
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await markPdfOutdated();
  await logActivity({
    action: 'product.deleted',
    entityType: 'product',
    entityId: id,
    entityName: existing.name ?? null,
    description: `Deleted product “${existing.name}”.`,
    metadata: { name: existing.name, slug: existing.slug, category_id: existing.category_id },
  });
  return NextResponse.json({ success: true });
}
