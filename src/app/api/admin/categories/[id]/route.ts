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

  const { data: existing } = await supabase.from('categories').select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const changes = diffRecord(existing, body);

  const { data, error } = await supabase
    .from('categories')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    await logActivity({
      action: 'category.updated',
      entityType: 'category',
      entityId: id,
      entityName: existing.name ?? null,
      description: `Updating category “${existing.name}” failed.`,
      metadata: { error: error.message },
      status: 'failed',
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await markPdfOutdated();

  const statusChanged = changes.status && existing.status !== body.status;
  let action: string;
  if (statusChanged && body.status === 'published') action = 'category.published';
  else if (statusChanged && body.status === 'draft') action = 'category.unpublished';
  else action = 'category.updated';

  await logActivity({
    action,
    entityType: 'category',
    entityId: id,
    entityName: data.name,
    description: action === 'category.updated'
      ? `Updated category “${data.name}”.`
      : `Category “${data.name}” ${body.status === 'published' ? 'published' : 'unpublished'}.`,
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

  const { data: existing } = await supabase.from('categories').select('name, slug, display_order').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    await logActivity({
      action: 'category.deleted',
      entityType: 'category',
      entityId: id,
      entityName: existing.name ?? null,
      description: `Deleting category “${existing.name}” failed.`,
      metadata: { error: error.message },
      status: 'failed',
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await markPdfOutdated();
  await logActivity({
    action: 'category.deleted',
    entityType: 'category',
    entityId: id,
    entityName: existing.name ?? null,
    description: `Deleted category “${existing.name}”.`,
    metadata: { name: existing.name, slug: existing.slug, display_order: existing.display_order },
  });
  return NextResponse.json({ success: true });
}
