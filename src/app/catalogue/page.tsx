import type { Metadata } from "next";
import { getCategories, getProducts, getOrderedCategories } from "@/lib/catalog-supabase";
import { CataloguePaper } from "@/components/catalogue/CataloguePaper";

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategories();
  const products = await getProducts();
  const orderedCategories = getOrderedCategories(categories);
  return {
    title: "Catalogue 2026",
    description: `GEA Product Catalogue 2026 — ${products.length} products across ${orderedCategories.length} trade sections. A document-first catalogue.`,
    alternates: { canonical: "/catalogue" },
    openGraph: {
      title: "GEA — Product Catalogue 2026",
      description: `${products.length} products, ${orderedCategories.length} sections. A printed catalogue on the web.`,
    },
  };
}

export default async function CataloguePage() {
  const categories = await getCategories();
  const products = await getProducts();
  const orderedCategories = getOrderedCategories(categories);

  return <CataloguePaper categories={orderedCategories} products={products} />;
}