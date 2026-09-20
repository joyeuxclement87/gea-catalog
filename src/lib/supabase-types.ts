export type CategoryStatus = 'published' | 'draft';
export type ProductStatus = 'published' | 'draft';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  display_order: number;
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  categorySlug: string;
  image: string | null;
  description: string | null;
  price: number | null;
  sku: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ProductWithCategory extends Product {
  category: Category;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  totalCategories: number;
}