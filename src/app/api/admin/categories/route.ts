import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { markPdfOutdated } from '@/lib/pdf-status';
import { logActivity } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const supabase = createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('categories')
    .insert(body)
    .select()
    .single();

  if (error) {
    await logActivity({
      action: 'category.created',
      entityType: 'category',
      entityName: typeof body?.name === 'string' ? body.name : null,
      description: 'Category creation failed.',
      metadata: { error: error.message },
      status: 'failed',
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await markPdfOutdated();
  await logActivity({
    action: 'category.created',
    entityType: 'category',
    entityId: data.id,
    entityName: data.name,
    description: `Created category “${data.name}”.`,
    metadata: { name: data.name, slug: data.slug, status: data.status },
  });
  return NextResponse.json(data);
}
