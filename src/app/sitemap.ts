import type { MetadataRoute } from "next";
import { getCategories, getProducts, getOrderedCategories } from "@/lib/catalog-supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gea-catalog.local";
  const categories = getOrderedCategories(await getCategories());
  const products = await getProducts();

  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalogue`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...categories.map((c) => ({
      url: `${base}/catalogue/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/catalogue/${p.categorySlug}/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
