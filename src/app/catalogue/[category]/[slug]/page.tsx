import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProducts,
  getProductsStatic,
  getCategories,
  getOrderedCategories,
  getProductBySlug,
  folio,
  sectionCount,
} from "@/lib/catalog-supabase";
import { CatalogueShell } from "@/components/catalogue/CatalogueShell";
import { ProductGallery } from "@/components/catalogue/ProductGallery";

type Params = { category: string; slug: string };

export async function generateStaticParams() {
  const products = await getProductsStatic();
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
    "group flex flex-1 flex-col gap-2 px-6 py-5 transition-colors hover:bg-[var(--brand-blue-light)]/50";

  const categoryName = product.category?.name || product.categorySlug;
  const figIndex = String(idx + 1).padStart(2, "0");

  const revision = (() => {
    try {
      return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
        new Date(product.updated_at),
      );
    } catch {
      return "2026";
    }
  })();

  const specRows = [
    { term: "Reference", detail: `GEA-${product.id.toUpperCase()}` },
    { term: "Catalogue section", detail: categoryName },
    { term: "SKU", detail: product.sku || "Not assigned" },
    { term: "Revision", detail: revision },
  ];

  return (
    <CatalogueShell>
      {/* running head — breadcrumb left, folio right */}
      <div className="detail-runhead px-6 pt-6 sm:px-10">
        <div className="flex items-center gap-3">
          <Link href="/catalogue" className="catalogue-link label text-[9.5px]">
            GEA Catalogue
          </Link>
          <span className="text-[var(--muted-2)]" aria-hidden>/</span>
          <Link href={`/catalogue/${product.categorySlug}`} className="catalogue-link label text-[9.5px]">
            {categoryName}
          </Link>
          <span className="text-[var(--muted-2)]" aria-hidden>/</span>
          <span className="label text-[9.5px] text-[var(--muted)]">{product.name}</span>
        </div>
        <p className="label flex items-baseline gap-1.5 tabular-nums text-[9.5px] text-[var(--muted)]">
          <span className="text-[8px] text-[var(--muted-2)]">Page</span>
          {folioNum} / {folio(total)}
        </p>
      </div>

      <article>
        {/* two-column data sheet — information left, matted plate right */}
        <div className="detail-opener px-6 pb-12 pt-8 sm:px-10 sm:pb-14 sm:pt-10">
          <span className="detail-ghost" aria-hidden>
            {figIndex}
          </span>

          <div className="relative z-[1]">
            <div className="flex items-center gap-4">
              <span className="label tabular-nums font-semibold text-[var(--brand-blue)]">{figIndex}</span>
              <span className="h-px w-8 bg-[var(--brand-blue)]" aria-hidden />
              <span className="label text-[var(--muted)]">{categoryName} &#183; data sheet</span>
            </div>

            <h1 className="balance mt-5 max-w-[20ch] font-serif text-[clamp(32px,5.5vw,54px)] font-[460] leading-[0.98] tracking-[-0.03em] text-[var(--ink)]">
              {product.name}
            </h1>

            {product.description ? (
              <p className="mt-7 max-w-[48ch] font-serif text-[16px] leading-[1.75] text-[var(--ink-2)]">
                {product.description}
              </p>
            ) : null}

            {/* spec strip — hairline-ruled sheet data */}
            <dl className="mt-9 grid max-w-lg grid-cols-1 gap-px overflow-hidden border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {specRows.map((row) => (
                <div key={row.term} className="bg-white px-4 py-3.5">
                  <dt className="label text-[9px] text-[var(--muted)]">{row.term}</dt>
                  <dd className="mt-1.5 truncate font-sans text-[13px] font-medium tracking-[0.01em] text-[var(--ink)]">
                    {row.detail}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex items-center gap-3">
              <span className="h-[3px] w-14 bg-[var(--brand-blue)]" aria-hidden />
              <span className="h-px flex-1 bg-[var(--line-strong)]" aria-hidden />
            </div>

            <Link
              href="/catalogue#contact"
              className="catalogue-link label mt-8 inline-flex items-center gap-2 text-[9.5px]"
            >
              Request a technical sheet
              <span aria-hidden>→</span>
            </Link>
          </div>

          <figure className="detail-plate">
            <div className="detail-plate-frame">
              <ProductGallery slug={product.slug} name={product.name} imageUrl={product.image} images={product.images} />
            </div>
            <figcaption className="section-caption">
              <span className="label text-[var(--muted)]">Fig. {figIndex} &#8212; {product.name}</span>
              <span className="hidden flex-1 border-b border-dotted border-[var(--line-strong)] sm:block" aria-hidden />
              <span className="label tabular-nums text-[var(--brand-blue)]">{categoryName}</span>
            </figcaption>
          </figure>
        </div>

        {/* previous / next — continuation of the section */}
        <div className="mx-4 grid grid-cols-1 gap-px border border-[var(--line)] bg-[var(--line)] sm:mx-8 sm:grid-cols-2">
          {prev ? (
            <Link href={`/catalogue/${prev.categorySlug}/${prev.slug}`} className={navCell}>
              <span className="label text-[9px] text-[var(--brand-blue)]">&#8249; Previous product</span>
              <span className="line-clamp-2 font-serif text-[15px] leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--brand-blue-dark)]">
                {prev.name}
              </span>
            </Link>
          ) : (
            <div className="flex items-center px-6 py-5">
              <span className="font-sans text-[11px] italic tracking-wide text-[var(--muted-2)]">
                First product in this section
              </span>
            </div>
          )}
          {next ? (
            <Link href={`/catalogue/${next.categorySlug}/${next.slug}`} className={`${navCell} sm:text-right`}>
              <span className="label text-[9px] text-[var(--brand-blue)]">Next product &#8250;</span>
              <span className="line-clamp-2 font-serif text-[15px] leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--brand-blue-dark)]">
                {next.name}
              </span>
            </Link>
          ) : (
            <div className="flex items-center px-6 py-5 sm:justify-end">
              <span className="font-sans text-[11px] italic tracking-wide text-[var(--muted-2)]">
                Last product in this section
              </span>
            </div>
          )}
        </div>

        <div className="mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 px-1 pb-10 sm:mx-8 sm:pb-12">
          <Link href="/catalogue#contents" className="catalogue-link label text-[9.5px]">
            &#8592; Back to contents
          </Link>
          <p className="label flex items-baseline gap-1.5 tabular-nums text-[9.5px] text-[var(--muted)]">
            <span className="text-[8px] text-[var(--muted-2)]">Page</span>
            {folioNum} &#183; {idx + 1} / {catProducts.length}
          </p>
        </div>
      </article>
    </CatalogueShell>
  );
}