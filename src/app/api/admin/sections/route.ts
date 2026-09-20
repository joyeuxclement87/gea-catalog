import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { data, error } = await createServiceClient().from('catalogue_sections').select('*').order('display_order', { ascending: true });
  if (error) return NextResponse.json({ error: 'Sections are unavailable until the migration is applied.' }, { status: 503 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = await request.json();
  const { data, error } = await createServiceClient().from('catalogue_sections').insert(body).select().single();
  if (error) return NextResponse.json({ error: 'Unable to create section.' }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
