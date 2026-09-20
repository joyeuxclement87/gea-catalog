import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { markPdfOutdated } from '@/lib/pdf-status';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'updated';
  const sortConfig = sort === 'name_asc'
    ? { column: 'name', ascending: true }
    : sort === 'name_desc'
      ? { column: 'name', ascending: false }
      : sort === 'created'
        ? { column: 'created_at', ascending: false }
        : { column: 'updated_at', ascending: false };

  let query = supabase
    .from('products')
    .select('*, category:categories(*), product_images(*)', { count: 'exact' })
    .order(sortConfig.column, { ascending: sortConfig.ascending })
    .range((page - 1) * limit, page * limit - 1);

  if (search) query = query.ilike('name', `%${search}%`);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    products: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const supabase = createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('products')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await markPdfOutdated();
  return NextResponse.json(data);
}
