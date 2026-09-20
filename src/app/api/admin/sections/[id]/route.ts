import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { markPdfOutdated } from '@/lib/pdf-status';
import { diffRecord, logActivity } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';

type Params = { id: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const body = await request.json();

  const record: Record<string, unknown> = {};
  if (body.title !== undefined) record.title = String(body.title);
  if (body.description !== undefined) record.description = body.description === '' ? null : String(body.description);
  if (body.display_order !== undefined) record.display_order = Number(body.display_order) || 0;
  if (body.status !== undefined) record.status = String(body.status);
  if (body.slug !== undefined) record.slug = slugify(String(body.slug)) || slugify(String(record.title ?? ''));

  const supabase = createServiceClient();
  const { data: existing } = await supabase.from('catalogue_sections').select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const changes = diffRecord(existing, record);

  const { data, error } = await supabase
    .from('catalogue_sections')
    .update(record)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    await logActivity({
      action: 'section.updated',
      entityType: 'section',
      entityId: id,
      entityName: existing.title ?? null,
      description: `Updating section “${existing.title}” failed.`,
      metadata: { error: error.message },
      status: 'failed',
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await markPdfOutdated();

  const statusChanged = changes.status && existing.status !== record.status;
  let action: string;
  if (statusChanged && record.status === 'published') action = 'section.published';
  else if (statusChanged && record.status === 'draft') action = 'section.unpublished';
  else action = 'section.updated';

  await logActivity({
    action,
    entityType: 'section',
    entityId: id,
    entityName: data.title,
    description: action === 'section.updated'
      ? `Updated section “${data.title}”.`
      : `Section “${data.title}” ${record.status === 'published' ? 'published' : 'unpublished'}.`,
    metadata: Object.keys(changes).length > 0 ? { changes } : null,
  });

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<Params> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: existing } = await supabase.from('catalogue_sections').select('title, slug, display_order').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('catalogue_sections').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await markPdfOutdated();
  await logActivity({
    action: 'section.deleted',
    entityType: 'section',
    entityId: id,
    entityName: existing.title ?? null,
    description: `Deleted section “${existing.title}”.`,
    metadata: { title: existing.title, slug: existing.slug, display_order: existing.display_order },
  });
  return NextResponse.json({ success: true });
}