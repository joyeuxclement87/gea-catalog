import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { markPdfOutdated } from '@/lib/pdf-status';
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

  const { data, error } = await supabase
    .from('categories')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await markPdfOutdated();
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

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await markPdfOutdated();
  return NextResponse.json({ success: true });
}
