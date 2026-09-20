import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProducts,
  getProductsStatic,
  getCategories,
  getCategoriesStatic,
  getOrderedCategories,
  getProductBySlug,
  folio,
  sectionCount,
} from "@/lib/catalog-supabase";
import { CatalogueShell } from "@/components/catalogue/CatalogueShell";
import { ProductGallery } from "@/components/catalogue/ProductGallery";

type Params = { category: string; slug: string };

export async function generateStaticParams() {
  const categories = await getCategoriesStatic();
  const products = await getProductsStatic();
  const orderedCategories = getOrderedCategories(categories);
  return products.map((p) => ({ category: p.categorySlug, slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProductBySlug(category, slug);
  if (!product) return {};
  
  const image = product.image;
  return {
    title: product.name,
    description: `${product.name} — ${product.category?.name || product.categorySlug}. GEA Product Catalogue 2026.`,
    alternates: { canonical: `/catalogue/${product.categorySlug}/${product.slug}` },
    openGraph: {
      title: `${product.name} — GEA Catalogue`,
      description: product.category?.name || product.categorySlug,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
  const { category, slug } = await params;
  const product = await getProductBySlug(category, slug);
  if (!product) notFound();

  const categories = await getCategories();
  const products = await getProducts();
  const orderedCategories = getOrderedCategories(categories);
  const catIdx = orderedCategories.findIndex((c) => c.slug === product.categorySlug);
  const folioNum = folio(catIdx + 3);
  const total = sectionCount(orderedCategories);

  const catProducts = products.filter((p) => p.categorySlug === product.categorySlug);
  const idx = catProducts.findIndex((p) => p.slug === product.slug);
  const prev = idx > 0 ? catProducts[idx - 1] : null;
  const next = idx < catProducts.length - 1 ? catProducts[idx + 1] : null;

  const navCell =
    "group flex flex-1 flex-col gap-1.5 px-5 py-4 transition-colors hover:bg-[var(--paper-2)]";

  const categoryName = product.category?.name || product.categorySlug;

  return (
    <CatalogueShell>
      {/* breadcrumb */}
      <div className="flex items-center gap-3 px-6 pt-6 sm:px-10">
        <Link href="/catalogue" className="label text-[9.5px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
          GEA Catalogue
        </Link>
        <span className="text-[var(--muted-2)]" aria-hidden>/</span>
        <Link href={`/catalogue/${product.categorySlug}`} className="label text-[9.5px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
          {categoryName}
        </Link>
        <span className="ml-auto label tabular-nums text-[9.5px] text-[var(--muted)]">{folioNum} / {folio(total)}</span>
      </div>

      <article>
        {/* header */}
        <header className="px-6 pt-8 sm:px-10 sm:pt-12">
          <div className="flex items-center gap-4">
            <span className="label tabular-nums text-[var(--accent)]">{folioNum}</span>
            <span className="h-px w-8 bg-[var(--line-strong)]" aria-hidden />
            <span className="label text-[var(--muted)]">
              {categoryName} &#183; {catProducts.length} product{catProducts.length === 1 ? "" : "s"}
            </span>
          </div>

          <h1 className="balance mt-5 max-w-[24ch] font-serif text-[clamp(28px,5.5vw,40px)] font-[460] leading-[1.02] tracking-[-0.025em] text-[var(--ink)]">
            {product.name}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--line)] pt-4">
            <span className="label text-[9.5px] text-[var(--muted)]">{categoryName}</span>
            <span className="h-2.5 w-px bg-[var(--line-strong)]" aria-hidden />
            <span className="label tabular-nums text-[9.5px] text-[var(--muted)]">Ref. {product.id.toUpperCase()}</span>
          </div>
        </header>

        {/* image gallery */}
        <div className="mt-8 px-4 sm:px-8">
          <ProductGallery slug={product.slug} name={product.name} imageUrl={product.image} images={product.images} />
        </div>

        {/* description */}
        {product.description ? (
          <div className="mx-auto max-w-[60ch] px-6 pt-10 sm:px-10">
            <p className="font-serif text-[17px] leading-relaxed text-[var(--ink-2)]">{product.description}</p>
          </div>
        ) : null}

        {/* previous / next */}
        <div className="mx-4 mt-10 grid grid-cols-1 gap-px border border-[var(--line)] bg-[var(--line)] sm:mx-8 sm:grid-cols-2">
          {prev ? (
            <Link href={`/catalogue/${prev.categorySlug}/${prev.slug}`} className={navCell}>
              <span className="label text-[9px] text-[var(--muted)]">&#8249; Previous product</span>
              <span className="line-clamp-2 font-serif text-[15px] leading-snug text-[var(--ink)]">{prev.name}</span>
            </Link>
          ) : (
            <div className="flex items-center px-5 py-4">
              <span className="font-sans text-[11px] italic tracking-wide text-[var(--muted-2)]">First product in this section</span>
            </div>
          )}
          {next ? (
            <Link href={`/catalogue/${next.categorySlug}/${next.slug}`} className={`${navCell} sm:text-right`}>
              <span className="label text-[9px] text-[var(--muted)]">Next product &#8250;</span>
              <span className="line-clamp-2 font-serif text-[15px] leading-snug text-[var(--ink)]">{next.name}</span>
            </Link>
          ) : (
            <div className="flex items-center px-5 py-4 sm:justify-end">
              <span className="font-sans text-[11px] italic tracking-wide text-[var(--muted-2)]">Last product in this section</span>
            </div>
          )}
        </div>

        <div className="mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 px-1 pb-10 sm:mx-8 sm:pb-12">
          <Link href="/catalogue#contents" className="label text-[9.5px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
            &#8592; Back to contents
          </Link>
          <p className="label tabular-nums text-[9.5px] text-[var(--muted)]">
            {folioNum} &#183; {idx + 1} / {catProducts.length}
          </p>
        </div>
      </article>
    </CatalogueShell>
  );
}
