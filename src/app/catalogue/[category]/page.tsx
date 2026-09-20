import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoriesStatic, getProducts, getCategoryBySlug, getOrderedCategories } from "@/lib/catalog-supabase";
import { CataloguePaper } from "@/components/catalogue/CataloguePaper";
import { ScrollToSection } from "@/components/catalogue/ScrollToSection";

type Params = { category: string };

export async function generateStaticParams() {
  const categories = await getCategoriesStatic();
  return getOrderedCategories(categories).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return {};
  return {
    title: cat.name,
    description: `${cat.name} — GEA Catalogue 2026.`,
    alternates: { canonical: `/catalogue/${cat.slug}` },
    openGraph: { title: `${cat.name} — GEA Catalogue` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();

  const categories = await getCategories();
  const products = await getProducts();
  const orderedCategories = getOrderedCategories(categories);

  return (
    <>
      <CataloguePaper categories={orderedCategories} products={products} />
      <ScrollToSection id={`cat-${cat.slug}`} />
    </>
  );
}