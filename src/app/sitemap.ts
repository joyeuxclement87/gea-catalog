import type { MetadataRoute } from "next";
import { getProducts, getOrderedCategories } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://gea-catalog.local";
  const categories = getOrderedCategories();
  const products = getProducts();

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
