import type { Metadata } from "next";
import { getCategories, getProducts, getOrderedCategories, getPublishedSections } from "@/lib/catalog-supabase";
import { CataloguePrint } from "@/components/catalogue/CataloguePrint";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue 2026 — Print Edition",
  robots: { index: false, follow: false },
};

export default async function CataloguePrintPage() {
  const categories = await getCategories();
  const products = await getProducts();
  const orderedCategories = getOrderedCategories(categories);
  const sections = await getPublishedSections();

  return <CataloguePrint categories={orderedCategories} products={products} sections={sections} />;
}