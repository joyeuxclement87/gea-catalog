import type { Category, Product } from "@/lib/supabase-types";
import { folio, sectionCount } from "@/lib/catalog-supabase";
import { CatalogueShell, Hairline, FolioFooter } from "./CatalogueShell";
import { ProductCard } from "./ProductCard";
import { CoverImage, CategoryImage } from "./ProductImage";
import { CatalogueToolbar } from "./CatalogueToolbar";
import { PageNav } from "./PageNav";

type Props = {
  categories: Category[];
  products: Product[];
};

export function CataloguePaper({ categories, products }: Props) {
  const byCategory = (slug: string) => products.filter((p) => p.categorySlug === slug);
  const sectionIds = ["cover", "contents", ...categories.map((c) => `cat-${c.slug}`), "contact"];
  const total = sectionCount(categories);

  const searchEntries = products.map((p) => ({
    name: p.name,
    category: p.category?.name ?? p.categorySlug,
    href: `/catalogue/${p.categorySlug}/${p.slug}`,
  }));

  // Find cover image from categories or use first category image
  const coverImage = categories.find(c => c.image)?.image ?? null;

  return (
    <CatalogueShell>
      <CatalogueToolbar products={searchEntries} />

      {/* ── COVER ───────────────────────────────────────────── */}
      <section id="cover" className="scroll-mt-12">
        <div className="px-6 pt-16 sm:px-12 sm:pt-20">
          <div className="flex items-start justify-between gap-6">
            <img
              src="/GEA - logo.png"
              alt="GEA"
              width={3480}
              height={1588}
              className="h-10 w-auto sm:h-12"
            />
            <p className="label pt-2 text-[var(--muted)]">General Engineering &#183; 2026</p>
          </div>

          <div className="mt-14 flex justify-center sm:mt-20">
            <span className="h-px w-12 bg-[var(--accent)]" />
          </div>

          <h1 className="balance mt-10 text-center font-serif text-[clamp(48px,12vw,120px)] font-[380] leading-[0.88] tracking-[-0.04em] text-[var(--ink)]">
            Product
            <br />
            <em className="font-[320]">Catalogue</em>
          </h1>

          <p className="mt-14 text-center label text-[var(--muted)] tracking-[0.24em]">
            Edition One
            <br className="sm:hidden" />
            <span className="mx-2 hidden sm:inline text-[var(--muted-2)]">&#183;</span>
            {products.length} products &#183; {categories.length} sections
          </p>
        </div>

        <div className="mt-16 px-6 sm:mt-24 sm:px-12">
          <div className="relative aspect-[4/3] overflow-hidden border border-[var(--line)] bg-[var(--paper-2)] sm:aspect-[16/9]">
            <CoverImage imageUrl={coverImage} className="object-cover" />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 pt-10 sm:px-12">
          <p className="label text-[var(--muted)]">Building materials &#183; Electrical &#183; Safety &#183; Sanitary</p>
          <p className="label tabular-nums text-[var(--muted)]">01</p>
        </div>

        <div className="px-6 pb-16 pt-16 text-center sm:px-12">
          <a
            href="#contents"
            className="inline-block border border-[var(--ink)] px-10 py-4 label text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          >
            OPEN THE CATALOGUE &#8595;
          </a>
        </div>
      </section>

      <Hairline />

      {/* ── CONTENTS ────────────────────────────────────────── */}
      <section id="contents" className="scroll-mt-12">
        <div className="px-6 py-12 sm:px-10 sm:py-16">
          <div className="flex items-center gap-4">
            <span className="label tabular-nums text-[var(--accent)]">02</span>
            <span className="h-px w-8 bg-[var(--line-strong)]" aria-hidden />
            <span className="label text-[var(--muted)]">Table of contents</span>
          </div>

          <h2 className="balance mt-4 font-serif text-[clamp(28px,5.5vw,42px)] font-[440] leading-none tracking-[-0.02em] text-[var(--ink)]">
            Contents
          </h2>

          <ol className="mt-10 border-t border-[var(--ink)]">
            {categories.map((c, i) => (
              <li key={c.slug} className="border-b border-[var(--line)]">
                <a href={`#cat-${c.slug}`} className="group flex items-baseline gap-4 py-5 transition-colors hover:bg-[var(--paper-2)] sm:gap-6">
                  <span className="w-8 shrink-0 label tabular-nums text-[var(--muted)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-[16px] font-[470] leading-snug tracking-[-0.01em] text-[var(--ink)] sm:text-[18px]">
                    {c.name}
                  </span>
                  <span className="hidden flex-1 border-b border-dotted border-[var(--line-strong)] sm:block" aria-hidden />
                  <span className="ml-auto shrink-0 sm:ml-0 sm:w-16 sm:text-right label tabular-nums text-[var(--muted)]">
                    {String(c.productCount ?? products.filter(p => p.categorySlug === c.slug).length).padStart(3, "0")}
                  </span>
                  <span className="hidden w-8 shrink-0 text-right label tabular-nums text-[var(--muted)] sm:block">
                    {folio(i + 3)}
                  </span>
                </a>
              </li>
            ))}
          </ol>

          <div className="flex items-center justify-between pt-6">
            <p className="label text-[var(--muted)]">{products.length} products in total</p>
            <p className="label tabular-nums text-[var(--muted)]">02 / {folio(total)}</p>
          </div>
        </div>
      </section>

      <Hairline />

      {/* ── CATEGORY SECTIONS ───────────────────────────────── */}
      {categories.map((c, i) => {
        const productsInCategory = byCategory(c.slug);
        const folioNum = folio(i + 3);
        const sectionNum = String(i + 1).padStart(2, "0");
        return (
          <section key={c.slug} id={`cat-${c.slug}`} className="scroll-mt-12">
            {/* divider — reads as a new chapter */}
            <div className="px-6 pt-14 sm:px-10 sm:pt-20">
              <div className="flex items-center gap-4">
                <span className="label tabular-nums text-[var(--accent)]">{folioNum}</span>
                <span className="h-px w-8 bg-[var(--line-strong)]" aria-hidden />
                <span className="label text-[var(--muted)]">
                  Section {sectionNum} &#183; {productsInCategory.length} product{productsInCategory.length === 1 ? "" : "s"}
                </span>
              </div>
              <h2 className="balance mt-5 max-w-[18ch] font-serif text-[clamp(32px,6.5vw,50px)] font-[440] leading-[0.96] tracking-[-0.025em] text-[var(--ink)]">
                {c.name}
              </h2>
              <div className="mt-6 h-px w-16 bg-[var(--ink)]" aria-hidden />
            </div>

            <div className="relative mt-10 aspect-[16/6] overflow-hidden border-y border-[var(--line)] bg-[var(--paper-2)] sm:aspect-[16/5]">
              <CategoryImage slug={c.slug} name={c.name} imageUrl={c.image} className="object-cover" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 sm:px-10">
              <p className="label text-[9px] text-[var(--muted)]">{productsInCategory.length} items in this section</p>
              <p className="label tabular-nums text-[9px] text-[var(--muted)]">{folioNum} / {folio(total)}</p>
            </div>
            <Hairline />

            {/* product grid — dense, quiet, framed like printed plates */}
            <div className="border-b border-[var(--line)]">
              <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {productsInCategory.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {productsInCategory.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <p className="font-serif text-[14px] italic text-[var(--muted)]">No products in this section.</p>
                </div>
              )}
            </div>
          </section>
        );
      })}

      <Hairline />

      {/* ── CLOSING NOTE ────────────────────────────────────── */}
      <section id="contact" className="scroll-mt-12">
        <div className="px-6 py-12 sm:px-10 sm:py-16">
          <div className="flex items-center gap-4">
            <span className="label tabular-nums text-[var(--accent)]">{folio(total)}</span>
            <span className="h-px w-8 bg-[var(--line-strong)]" aria-hidden />
            <span className="label text-[var(--muted)]">Closing note</span>
          </div>

          <div className="mt-8 grid gap-10 border-t border-[var(--line)] pt-8 sm:grid-cols-2">
            <div>
              <h3 className="font-serif text-[22px] font-[450] tracking-[-0.01em] text-[var(--ink)]">Catalogue desk</h3>
              <p className="mt-3 max-w-[44ch] font-sans text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                For specifications, technical sheets, stock and quotations, contact the catalogue desk. This is a
                document-first catalogue; pricing and ordering are handled separately.
              </p>
              <p className="mt-5 font-sans text-[12px] tracking-[0.06em] text-[var(--muted)]">catalogue@gea.example &#160;&#183;&#160; +00 000 000 000</p>
            </div>
            <div className="sm:justify-self-end">
              <p className="label text-[9.5px] text-[var(--muted)]">Edition</p>
              <p className="mt-2 font-serif text-[15px] leading-relaxed text-[var(--ink)]">
                GEA Product Catalogue &#8212; Edition One, 2026
                <br />
                {products.length} products &#183; {categories.length} sections
              </p>
              <a
                href="#cover"
                className="mt-6 inline-block font-sans text-[11px] font-medium tracking-[0.18em] text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-6 transition-colors hover:text-[var(--accent)]"
              >
                BACK TO COVER
              </a>
            </div>
          </div>
        </div>
      </section>

      <FolioFooter left="GEA catalogue — 2026" right={`${folio(total)} / ${folio(total)}`} />

      <PageNav sectionIds={sectionIds} />
    </CatalogueShell>
  );
}