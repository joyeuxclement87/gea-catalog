import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { markPdfOutdated } from '@/lib/pdf-status';
import { NextRequest, NextResponse } from 'next/server';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

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
  const title = String(body.title ?? '').trim();
  if (!title) return NextResponse.json({ error: 'Section title is required.' }, { status: 400 });

  const record = {
    title,
    slug: slugify(String(body.slug ?? '')) || slugify(title),
    description: body.description === '' ? null : (body.description ?? null),
    display_order: Number(body.display_order) || 0,
    status: body.status === 'draft' ? 'draft' : 'published',
  };

  const { data, error } = await createServiceClient().from('catalogue_sections').insert(record).select().single();
  if (error) return NextResponse.json({ error: 'Unable to create section.' }, { status: 400 });

  await markPdfOutdated();
  return NextResponse.json(data, { status: 201 });
}