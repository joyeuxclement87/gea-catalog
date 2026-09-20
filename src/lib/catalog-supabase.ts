import { createServerClient, createServiceClient } from './supabase';
import type { Category, CatalogueSection, Product, ProductImage, ProductWithCategory } from './supabase-types';
import { getProducts as getLocalProducts, getCategories as getLocalCategories } from './catalog';

async function getClient() {
  return createServerClient();
}

function getStaticClient() {
  return createServiceClient();
}

function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function toSupabaseCategory(cat: any): Category {
  return {
    id: cat.id || `cat-${cat.slug}`,
    name: cat.name,
    slug: cat.slug,
    description: null,
    image: cat.image || null,
    display_order: 0,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    productCount: cat.productCount,
  };
}

function toSupabaseProduct(prod: any): Product {
  return {
    id: prod.id || `prod-${prod.slug}`,
    name: prod.name,
    slug: prod.slug,
    category_id: `cat-${prod.categorySlug}`,
    categorySlug: prod.categorySlug,
    image: prod.image || null,
    description: null,
    price: null,
    sku: null,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: undefined,
    images: undefined,
  };
}

function normalizeProduct(prod: any): Product {
  const images = (prod.product_images ?? prod.images ?? [])
    .filter((image: ProductImage) => image?.image_url)
    .sort((a: ProductImage, b: ProductImage) => a.display_order - b.display_order);
  const primary = images.find((image: ProductImage) => image.is_primary) ?? images[0];

  return {
    ...prod,
    image: primary?.image_url ?? prod.image ?? null,
    images,
    categorySlug: prod.category?.slug ?? prod.categorySlug ?? '',
  } as Product;
}

function isMissingProductImages(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST200';
}

function toSupabaseProductWithCategory(prod: any): ProductWithCategory {
  return {
    ...toSupabaseProduct(prod),
    category: toSupabaseCategory({ ...prod.category, slug: prod.categorySlug }),
  };
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return getLocalCategories().map(toSupabaseCategory);
  }
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPublishedSections(): Promise<CatalogueSection[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('catalogue_sections')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });
  if (error) {
    if (error.code === 'PGRST205') return [];
    throw error;
  }
  return data ?? [];
}

// For static generation (generateStaticParams) - uses service role
export async function getCategoriesStatic(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return getLocalCategories().map(toSupabaseCategory);
  }
  const supabase = getStaticClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAllCategoriesAdmin(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return getLocalCategories().map(toSupabaseCategory);
  }
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) {
    const cat = getLocalCategories().find(c => c.slug === slug);
    return cat ? toSupabaseCategory(cat) : null;
  }
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) return null;
  return data;
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return getLocalProducts().map(toSupabaseProduct);
  }
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(slug), product_images(*)')
    .eq('status', 'published')
    .order('name', { ascending: true });

  if (error && isMissingProductImages(error)) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('products')
      .select('*, category:categories(slug)')
      .eq('status', 'published')
      .order('name', { ascending: true });
    if (fallbackError) throw fallbackError;
    return (fallback ?? []).map(normalizeProduct);
  }
  if (error) throw error;
  
  return (data ?? []).map(normalizeProduct);
}

// For static generation (generateStaticParams) - uses service role
export async function getProductsStatic(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return getLocalProducts().map(toSupabaseProduct);
  }
  const supabase = getStaticClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(slug), product_images(*)')
    .eq('status', 'published')
    .order('name', { ascending: true });

  if (error && isMissingProductImages(error)) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('products')
      .select('*, category:categories(slug)')
      .eq('status', 'published')
      .order('name', { ascending: true });
    if (fallbackError) throw fallbackError;
    return (fallback ?? []).map(normalizeProduct);
  }
  if (error) throw error;
  
  return (data ?? []).map(normalizeProduct);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return getLocalProducts()
      .filter(p => p.categorySlug === categorySlug)
      .map(toSupabaseProduct);
  }
  const supabase = await getClient();
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .eq('status', 'published')
    .single();

  if (!category) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(slug), product_images(*)')
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('name', { ascending: true });

  if (error && isMissingProductImages(error)) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('products')
      .select('*, category:categories(slug)')
      .eq('category_id', category.id)
      .eq('status', 'published')
      .order('name', { ascending: true });
    if (fallbackError) throw fallbackError;
    return (fallback ?? []).map(normalizeProduct);
  }
  if (error) throw error;
  
  return (data ?? []).map(normalizeProduct);
}

export async function getProductBySlug(categorySlug: string, productSlug: string): Promise<ProductWithCategory | null> {
  if (!isSupabaseConfigured()) {
    const product = getLocalProducts().find(p => p.categorySlug === categorySlug && p.slug === productSlug);
    return product ? toSupabaseProductWithCategory(product) : null;
  }
  const supabase = await getClient();
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .eq('status', 'published')
    .single();

  if (!category) return null;

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), product_images(*)')
    .eq('category_id', category.id)
    .eq('slug', productSlug)
    .eq('status', 'published')
    .single();

  if (error && isMissingProductImages(error)) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('category_id', category.id)
      .eq('slug', productSlug)
      .eq('status', 'published')
      .single();
    if (fallbackError || !fallback) return null;
    return normalizeProduct(fallback) as ProductWithCategory;
  }
  if (error) return null;
  
  const product = normalizeProduct(data) as ProductWithCategory;
  return {
    ...product,
    categorySlug: product.category?.slug ?? '',
  };
}

export async function searchProducts(query: string): Promise<ProductWithCategory[]> {
  if (!isSupabaseConfigured()) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results = getLocalProducts().filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
    return results.slice(0, 20).map(toSupabaseProductWithCategory);
  }
  const supabase = await getClient();
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), product_images(*)')
    .eq('status', 'published')
    .or(`name.ilike.%${q}%,category.name.ilike.%${q}%`)
    .limit(20);

  if (error) throw error;
  
  return (data ?? []).map((p: any) => normalizeProduct(p) as ProductWithCategory);
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return getLocalProducts().map(toSupabaseProduct);
  }
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(slug)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data ?? []).map((p: any) => ({
    ...p,
    categorySlug: p.category?.slug ?? '',
  })) as Product[];
}

export function folio(n: number): string {
  return String(n).padStart(2, '0');
}

export function sectionCount(categories: Category[]): number {
  return categories.length + 3;
}

export function getOrderedCategories(categories: Category[]): Category[] {
  // The admin Categories screen wins: reorder by display_order (ascending,
  // stable for ties). getCategories() already returns them display_order-
  // sorted; this guarantees the catalogue chapters mirror the admin list.
  return categories.slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

export async function getCategoryWithProductCount(slug: string): Promise<Category & { productCount: number } | null> {
  if (!isSupabaseConfigured()) {
    const cat = getLocalCategories().find(c => c.slug === slug);
    if (!cat) return null;
    const count = getLocalProducts().filter(p => p.categorySlug === slug).length;
    return { ...toSupabaseCategory(cat), productCount: count };
  }
  const supabase = await getClient();
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!category) return null;

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', category.id)
    .eq('status', 'published');

  return { ...category, productCount: count ?? 0 };
}
