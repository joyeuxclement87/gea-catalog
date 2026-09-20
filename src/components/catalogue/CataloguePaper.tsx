import type { Category, CatalogueSection, Product } from "@/lib/supabase-types";
import Image from "next/image";
import { IconMail, IconMapPin, IconPhone, IconWorld } from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { folio, sectionCount } from "@/lib/catalog-supabase";
import { CatalogueShell, Hairline, FolioFooter } from "./CatalogueShell";
import { ProductCard } from "./ProductCard";
import { CoverImage, CategoryImage } from "./ProductImage";
import { CatalogueToolbar } from "./CatalogueToolbar";
import { PageNav } from "./PageNav";

type Props = {
  categories: Category[];
  products: Product[];
  sections?: CatalogueSection[];
};

export function CataloguePaper({ categories, products, sections = [] }: Props) {
  const byCategory = (slug: string) => products.filter((p) => p.categorySlug === slug);
  const sectionIds = ["cover", "contents", ...sections.map((s) => `custom-${s.slug}`), ...categories.map((c) => `cat-${c.slug}`), "contact"];
  const total = sectionCount(categories) + sections.length;

  const searchEntries = products.map((p) => ({
    name: p.name,
    category: p.category?.name ?? p.categorySlug,
    href: `/catalogue/${p.categorySlug}/${p.slug}`,
    image: p.image,
  }));

  const coverImage = "/images/cover/cover.jpg";

  return (
    <CatalogueShell>
      <CatalogueToolbar products={searchEntries} />

      {/* ── COVER ───────────────────────────────────────────── */}
      <section id="cover" className="catalogue-cover scroll-mt-12">
        <div className="px-6 pb-10 pt-14 sm:px-12 sm:pb-14 sm:pt-16">
          <div className="flex items-start justify-between gap-6">
            <Image
              src="/GEA - logo.png"
              alt="GEA"
              width={3480}
              height={1588}
              className="h-10 w-auto sm:h-12"
            />
            <p className="label pt-2 text-[var(--brand-blue)]">Global Engineering Agency &#183; 2026</p>
          </div>

          <h1 className="balance mt-24 text-center font-serif text-[clamp(48px,12vw,120px)] font-[380] leading-[0.88] tracking-[-0.04em] text-[var(--ink)] sm:mt-32">
            Product <em className="font-[320]">Catalogue</em>
          </h1>

          <p className="mx-auto mt-8 max-w-[38ch] text-center font-serif text-[16px] leading-relaxed text-[var(--ink-2)]">
            A considered selection of products for building, engineering, safety and everyday infrastructure.
          </p>
        </div>

        <div className="px-6 sm:px-12">
          <div className="relative aspect-[4/3] overflow-hidden border border-[var(--line)] bg-[var(--paper-2)] sm:aspect-[16/9]">
            <CoverImage imageUrl={coverImage} className="object-cover" />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-6 sm:px-12">
          <p className="label text-[var(--brand-blue)]">General Engineering</p>
          <p className="label tabular-nums text-[var(--muted)]">01</p>
        </div>
        <div className="flex justify-center px-6 pb-12 pt-2 sm:px-12">
          <a href="#contents" className="catalogue-primary inline-flex items-center px-6 py-3 label transition-colors">
            Explore catalogue &#8595;
          </a>
        </div>
      </section>

      <Hairline />

      {/* ── CONTENTS ────────────────────────────────────────── */}
      <section id="contents" className="catalogue-contents scroll-mt-12">
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
                  <span className="w-8 shrink-0 label tabular-nums text-[var(--brand-blue)]">
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

      {sections.map((section, i) => (
        <section key={section.id} id={`custom-${section.slug}`} className="catalogue-category scroll-mt-12">
          <div className="px-6 pb-10 pt-14 sm:px-10 sm:pb-14 sm:pt-20">
            <div className="flex items-center gap-4">
              <span className="label tabular-nums text-[var(--brand-blue)]">{String(i + 1).padStart(2, "0")}</span>
              <span className="h-px w-8 bg-[var(--brand-blue)]" aria-hidden />
              <span className="label text-[var(--muted)]">Catalogue section</span>
            </div>
            <h2 className="mt-5 max-w-[18ch] font-serif text-[clamp(32px,6.5vw,50px)] font-[440] leading-[0.96] text-[var(--ink)]">{section.title}</h2>
            {section.description ? <p className="mt-4 max-w-[52ch] font-serif text-[15px] leading-relaxed text-[var(--ink-2)]">{section.description}</p> : null}
          </div>
          <div className="relative aspect-[16/6] overflow-hidden border-y border-[var(--line)] bg-[var(--brand-blue-light)] sm:aspect-[16/5]">
            {section.image_url ? <img src={section.image_url} alt={section.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center px-6 sm:px-10"><span className="label text-[var(--brand-blue)]">GEA catalogue section</span></div>}
          </div>
          <Hairline />
        </section>
      ))}

      {/* ── CATEGORY SECTIONS ───────────────────────────────── */}
      {categories.map((c, i) => {
        const productsInCategory = byCategory(c.slug);
        const folioNum = folio(i + 3);
        const sectionNum = String(i + 1).padStart(2, "0");
        return (
          <section key={c.slug} id={`cat-${c.slug}`} className="catalogue-category scroll-mt-12">
            {/* divider — reads as a new chapter */}
            <div className="px-6 pt-14 sm:px-10 sm:pt-20">
              <div className="flex items-center gap-4">
                <span className="label tabular-nums text-[var(--brand-blue)]">{folioNum}</span>
                <span className="h-px w-8 bg-[var(--line-strong)]" aria-hidden />
                <span className="label text-[var(--muted)]">
                  Section {sectionNum} &#183; {productsInCategory.length} product{productsInCategory.length === 1 ? "" : "s"}
                </span>
              </div>
              <h2 className="balance mt-5 max-w-[18ch] font-serif text-[clamp(32px,6.5vw,50px)] font-[440] leading-[0.96] tracking-[-0.025em] text-[var(--ink)]">
                {c.name}
              </h2>
              {c.description ? (
                <p className="mt-4 max-w-[52ch] font-serif text-[15px] leading-relaxed text-[var(--ink-2)]">{c.description}</p>
              ) : null}
              <div className="mt-6 h-px w-16 bg-[var(--brand-blue)]" aria-hidden />
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
              <div className="catalogue-product-grid grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
      <section id="contact" className="catalogue-contact scroll-mt-12">
        <div className="px-6 py-12 sm:px-10 sm:py-16">
          <div className="flex items-center gap-4">
            <span className="label tabular-nums text-[var(--accent)]">{folio(total)}</span>
            <span className="h-px w-8 bg-[var(--line-strong)]" aria-hidden />
            <span className="label text-[var(--muted)]">Closing note</span>
          </div>

          <div className="mt-8 grid gap-10 border-t border-[var(--brand-blue)] pt-8 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="label text-[var(--brand-blue)]">Thank you for exploring our catalogue</p>
              <h3 className="mt-2 font-serif text-[clamp(28px,5vw,42px)] font-[450] tracking-[-0.02em] text-[var(--ink)]">Let&apos;s connect.</h3>
              <p className="mt-3 max-w-[44ch] font-sans text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                For product information, technical details, and quotations, contact Global Engineering Agency
                directly. This catalogue is for product reference; pricing and ordering are handled separately.
              </p>
              <address className="mt-5 space-y-2 not-italic font-sans text-[12px] leading-relaxed tracking-[0.04em] text-[var(--muted)]">
                <a className="flex items-start gap-2 transition-colors hover:text-[var(--accent)]" href="tel:+250788632620">
                  <IconPhone size={15} stroke={1.5} className="mt-0.5 shrink-0" aria-hidden />
                  <span>+250 788 632 620</span>
                </a>
                <span className="flex items-start gap-2">
                  <IconMapPin size={15} stroke={1.5} className="mt-0.5 shrink-0" aria-hidden />
                  <span>Umukindo House, ground floor, 5 doors from BK</span>
                </span>
                <a className="flex items-start gap-2 transition-colors hover:text-[var(--accent)]" href="mailto:info@globalengineeringagency.com">
                  <IconMail size={15} stroke={1.5} className="mt-0.5 shrink-0" aria-hidden />
                  <span>info@globalengineeringagency.com</span>
                </a>
                <a
                  className="flex items-start gap-2 transition-colors hover:text-[var(--accent)]"
                  href="https://www.globalengineeringagency.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconWorld size={15} stroke={1.5} className="mt-0.5 shrink-0" aria-hidden />
                  <span>www.globalengineeringagency.com</span>
                </a>
              </address>
            </div>
            <div className="sm:justify-self-end">
              <div className="mb-6 w-fit border border-[var(--line)] bg-white p-3">
                <QRCodeSVG value="https://www.globalengineeringagency.com" size={132} bgColor="#ffffff" fgColor="#145aa8" includeMargin />
                <p className="mt-2 max-w-[18ch] text-center label text-[var(--brand-blue)]">Scan to view the catalogue online</p>
              </div>
              <p className="label text-[9.5px] text-[var(--muted)]">Edition</p>
              <p className="mt-2 font-serif text-[15px] leading-relaxed text-[var(--ink)]">
                GEA Product Catalogue &#8212; Edition One, 2026
                <br />
                {products.length} products &#183; {categories.length} sections
              </p>
              <a
                href="#cover"
                className="catalogue-secondary mt-6 inline-block px-4 py-2 font-sans text-[11px] font-medium tracking-[0.18em] transition-colors"
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
