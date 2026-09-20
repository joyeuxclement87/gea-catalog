export type CategoryStatus = 'published' | 'draft';
export type ProductStatus = 'published' | 'draft';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

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

export interface CatalogueSection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_path: string | null;
  display_order: number;
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
}

export interface CatalogueSettings {
  id: string;
  website_url: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  closing_message: string;
  cover_image_url: string;
  cover_image_path: string | null;
  updated_at: string;
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
  images?: ProductImage[];
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
