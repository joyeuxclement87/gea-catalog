import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { markPdfOutdated } from '@/lib/pdf-status';
import { diffRecord, logActivity } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';

const FIELDS = [
  'website_url',
  'contact_phone',
  'contact_email',
  'contact_address',
  'closing_message',
  'cover_image_url',
  'cover_image_path',
] as const;

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('catalogue_settings').select('*').limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: 'Settings are unavailable until the catalogue settings migration is applied.' }, { status: 503 });
  return NextResponse.json(data ?? null);
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = await request.json();
  const record: Record<string, string | null> = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) record[field] = body[field] === '' ? null : String(body[field]);
  }
  if (Object.keys(record).length === 0) {
    return NextResponse.json({ error: 'No settings provided.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase.from('catalogue_settings').select('*').limit(1).maybeSingle();
  const changes = diffRecord(existing as Record<string, unknown> | null | undefined, record);
  if (existing) {
    const { data, error } = await supabase
      .from('catalogue_settings')
      .update(record)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) {
      await logActivity({
        action: 'settings.updated',
        entityType: 'settings',
        entityName: 'Catalogue settings',
        description: 'Updating catalogue settings failed.',
        metadata: { error: error.message },
        status: 'failed',
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await markPdfOutdated();
    await logActivity({
      action: 'settings.updated',
      entityType: 'settings',
      entityId: existing.id,
      entityName: 'Catalogue settings',
      description: 'Updated catalogue settings.',
      metadata: Object.keys(changes).length > 0 ? { changes } : null,
    });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from('catalogue_settings')
    .insert(record)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await markPdfOutdated();
  await logActivity({
    action: 'settings.updated',
    entityType: 'settings',
    entityId: data.id,
    entityName: 'Catalogue settings',
    description: 'Updated catalogue settings.',
    metadata: { changes: record },
  });
  return NextResponse.json(data);
}