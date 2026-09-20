import { createServiceClient } from './supabase';
import type { DashboardStats } from './supabase-types';

function getClient() {
  return createServiceClient();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getClient();
  const [
    { count: totalProducts },
    { count: publishedProducts },
    { count: draftProducts },
    { count: totalCategories },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalProducts: totalProducts ?? 0,
    publishedProducts: publishedProducts ?? 0,
    draftProducts: draftProducts ?? 0,
    totalCategories: totalCategories ?? 0,
  };
}

export async function getProductsAdmin({
  page = 1,
  limit = 20,
  search = '',
  categoryId = '',
  status = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
} = {}) {
  const supabase = getClient();
  let query = supabase
    .from('products')
    .select('*, category:categories(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    products: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getCategoriesAdmin() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*, products(count)')
    .order('display_order', { ascending: true });

  if (error) throw error;
  
  return (data ?? []).map((cat: any) => ({
    ...cat,
    productCount: cat.products?.[0]?.count ?? 0,
  }));
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  display_order?: number;
  status?: 'published' | 'draft';
}) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, input: Partial<{
  name: string;
  slug: string;
  description: string;
  image: string;
  display_order: number;
  status: 'published' | 'draft';
}>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = getClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function createProduct(input: {
  name: string;
  slug: string;
  category_id: string;
  image?: string;
  description?: string;
  price?: number;
  sku?: string;
  status?: 'published' | 'draft';
}) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('products')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, input: Partial<{
  name: string;
  slug: string;
  category_id: string;
  image: string;
  description: string;
  price: number;
  sku: string;
  status: 'published' | 'draft';
}>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = getClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderCategories(updates: { id: string; display_order: number }[]) {
  const supabase = getClient();
  const { error } = await supabase.rpc('reorder_categories', { updates });
  if (error) throw error;
}