// Simple data-access layer. Today it reads local JSON; later it can be
// replaced with Supabase calls without touching any UI code.
import raw from "@/data/product-data.json";
import type { Category, Product } from "./types";

type Raw = typeof raw;
const data = raw as Raw & { products: Product[]; categories: Category[] };

export function getProducts(): Product[] {
  return data.products;
}

export function getCategories(): Category[] {
  return data.categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return data.categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return data.products.filter((p) => p.categorySlug === categorySlug);
}

export function getProductBySlug(categorySlug: string, productSlug: string): Product | undefined {
  return data.products.find((p) => p.categorySlug === categorySlug && p.slug === productSlug);
}

export function getProductById(id: string): Product | undefined {
  return data.products.find((p) => p.id === id);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return data.products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
  );
}

export function folio(n: number): string {
  return String(n).padStart(2, "0");
}

// Page numbering: cover(01), contents(02), each category, closing note.
export function sectionCount(categories: Category[]): number {
  return categories.length + 3;
}

// Ordered category list as they appear in the workbook (preserve discovery order
// rather than alpha, so the catalogue reads like a real stock order)
const WORKBOOK_ORDER = [
  "aluminium-equipments",
  "camera-camera-accessories",
  "electrical-equipment",
  "fire-fighting-equipment",
  "other-items",
  "plumbing-equipment",
  "safety-equipments",
  "security-equipments",
  "tiles-and-sanitary-wares",
];

export function getOrderedCategories(): Category[] {
  const bySlug = new Map(data.categories.map((c) => [c.slug, c]));
  return WORKBOOK_ORDER.map((s) => bySlug.get(s)!).filter(Boolean);
}
