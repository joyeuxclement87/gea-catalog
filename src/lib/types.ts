// Data model — ready for Supabase swap (price/hidden, sku, etc. optional)
export type Product = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  slug: string;
  image: string;
  // future / optional — not shown in Phase 1
  description?: string;
  price?: number;
  sku?: string;
  additionalImages?: string[];
  status?: "active" | "archived";
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  name: string;
  slug: string;
  image: string;
  productCount: number;
};
