import type { Category, CatalogueSection, Product } from "@/lib/supabase-types";
import Image from "next/image";
import { IconMail, IconMapPin, IconPhone, IconWorld } from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { folio, sectionCount } from "@/lib/catalog-supabase";
import { getCatalogueSettings } from "@/lib/catalog-settings";
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

export async function CataloguePaper({ categories, products, sections = [] }: Props) {
  const byCategory = (slug: string) => products.filter((p) => p.categorySlug === slug);
  const sectionIds = ["cover", "contents", ...sections.map((s) => `custom-${s.slug}`), ...categories.map((c) => `cat-${c.slug}`), "contact"];
  const total = sectionCount(categories) + sections.length;

  const settings = await getCatalogueSettings();
  const coverImage = settings.cover_image_url || "/images/cover/cover.jpg";

  const searchEntries = products.map((p) => ({
    name: p.name,
    category: p.category?.name ?? p.categorySlug,
    href: `/catalogue/${p.categorySlug}/${p.slug}`,
    image: p.image,
  }));

  const navCategories = categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }));

  return (
    <CatalogueShell>
      <CatalogueToolbar products={searchEntries} categories={navCategories} />

      {/* ── COVER ───────────────────────────────────────────── */}
      <section id="cover" className="catalogue-cover scroll-mt-28">
        <div className="relative px-6 pb-10 pt-12 sm:px-12 sm:pb-14 sm:pt-16">
          {/* blue vertical accent — restrained, printed-masthead feel */}
          <div className="absolute left-0 top-0 hidden h-full w-1 bg-[var(--brand-blue)] sm:block" aria-hidden />

          <div className="flex items-start justify-between gap-6 sm:pl-8">
            <Image
              src="/GEA - logo.png"
              alt="GEA"
              width={3480}
              height={1588}
              className="h-10 w-auto sm:h-13"
            />
            <p className="label pt-3 text-right text-[var(--brand-blue)]">
              Global Engineering Agency
              <br />
              <span className="text-[var(--muted)]">Edition 2026</span>
            </p>
          </div>

          <div className="mt-16 sm:mt-24 sm:pl-8">
            <p className="label font-semibold tracking-[0.34em] text-[var(--brand-blue)]">GEA</p>
            <h1 className="balance mt-4 font-serif text-[clamp(54px,13vw,128px)] font-[340] leading-[0.86] tracking-[-0.045em] text-[var(--ink)]">
              Product
              <br />
              Catalogue
            </h1>
            <div className="mt-9 h-[3px] w-16 bg-[var(--brand-blue)]" aria-hidden />
            <p className="mt-6 max-w-[38ch] font-serif text-[15px] leading-relaxed text-[var(--ink-2)] sm:text-[16px]">
              A considered selection of products for building, engineering, safety and everyday infrastructure.
            </p>
            <p className="label mt-10 tabular-nums text-[var(--brand-blue)]">2026 &#183; {String(products.length).padStart(3, "0")} products</p>
          </div>
        </div>

        <div className="px-6 sm:px-12">
          <div className="relative aspect-[4/3] overflow-hidden border border-[var(--line-strong)] bg-[var(--paper-2)] sm:aspect-[16/9]">
            <CoverImage imageUrl={coverImage} className="object-cover" />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-6 sm:px-12">
          <p className="label text-[var(--brand-blue)]">General Engineering</p>
          <p className="label tabular-nums text-[var(--muted)]">Page 01</p>
        </div>
        <div className="flex justify-center px-6 pb-12 pt-2 sm:px-12">
          <a href="#contents" className="catalogue-primary inline-flex items-center gap-2.5 px-7 py-3.5 label transition-colors">
            Explore catalogue <span aria-hidden>&#8595;</span>
          </a>
        </div>
      </section>

      <Hairline />

      {/* ── CONTENTS ────────────────────────────────────────── */}
      <section id="contents" className="catalogue-contents scroll-mt-28">
        <div className="px-6 py-12 sm:px-12 sm:py-16">
          <div className="flex items-center gap-4">
            <span className="label tabular-nums font-semibold text-[var(--brand-blue)]">02</span>
            <span className="h-px w-8 bg-[var(--brand-blue)]" aria-hidden />
            <span className="label text-[var(--muted)]">Table of contents</span>
          </div>

          <h2 className="balance mt-4 font-serif text-[clamp(30px,5.5vw,44px)] font-[440] leading-none tracking-[-0.02em] text-[var(--ink)]">
            Contents
          </h2>

          <ol className="mt-10 border-t border-[var(--ink)]">
            {categories.map((c, i) => {
              const count = c.productCount ?? products.filter((p) => p.categorySlug === c.slug).length;
              return (
                <li key={c.slug} className="border-b border-[var(--line)]">
                  <a href={`#cat-${c.slug}`} className="group flex items-center gap-5 py-5 transition-colors hover:bg-[var(--brand-blue-light)]/40 sm:gap-8">
                    <span className="w-9 shrink-0 label tabular-nums font-semibold text-[var(--brand-blue)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-serif text-[16px] font-[470] leading-snug tracking-[-0.01em] text-[var(--ink)] transition-colors group-hover:text-[var(--brand-blue-dark)] sm:text-[18px]">
                        {c.name}
                      </span>
                      <span className="label text-[9.5px] text-[var(--muted)]">
                        {count} product{count === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="hidden flex-1 border-b border-dotted border-[var(--line-strong)] sm:block" aria-hidden />
                    <span className="ml-auto hidden shrink-0 label tabular-nums text-[var(--muted)] sm:ml-0 sm:block">
                      Page {folio(i + 3)}
                    </span>
                    <span className="label text-[var(--brand-blue)] sm:hidden" aria-hidden>→</span>
                  </a>
                </li>
              );
            })}
          </ol>

          <div className="flex items-center justify-between pt-6">
            <p className="label text-[var(--muted)]">{products.length} products in total</p>
            <p className="label tabular-nums text-[var(--muted)]">PAGE 02 / {folio(total)}</p>
          </div>
        </div>
      </section>

      <Hairline />

      {sections.map((section, i) => (
        <section key={section.id} id={`custom-${section.slug}`} className="catalogue-category scroll-mt-28">
          <div className="px-6 pb-10 pt-14 sm:px-12 sm:pb-14 sm:pt-20">
            <div className="flex items-center gap-4">
              <span className="label tabular-nums font-semibold text-[var(--brand-blue)]">{String(i + 1).padStart(2, "0")}</span>
              <span className="h-px w-8 bg-[var(--brand-blue)]" aria-hidden />
              <span className="label text-[var(--muted)]">Catalogue section</span>
            </div>
            <h2 className="mt-5 max-w-[18ch] font-serif text-[clamp(32px,6.5vw,50px)] font-[440] leading-[0.96] text-[var(--ink)]">{section.title}</h2>
            {section.description ? <p className="mt-4 max-w-[52ch] font-serif text-[15px] leading-relaxed text-[var(--ink-2)]">{section.description}</p> : null}
          </div>
          <div className="relative aspect-[16/6] overflow-hidden border-y border-[var(--line)] bg-[var(--brand-blue-light)] sm:aspect-[16/5]">
            {section.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={section.image_url} alt={section.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center px-6 sm:px-12">
                <span className="label text-[var(--brand-blue)]">GEA &#183; {section.title}</span>
              </div>
            )}
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
          <section key={c.slug} id={`cat-${c.slug}`} className="catalogue-category scroll-mt-28">
            {/* chapter header — reads as a printed section opener */}
            <div className="px-6 pt-12 sm:px-12 sm:pt-16">
              <div className="flex items-center gap-4">
                <span className="label tabular-nums font-semibold text-[var(--brand-blue)]">{sectionNum}</span>
                <span className="h-px w-8 bg-[var(--brand-blue)]" aria-hidden />
                <span className="label text-[var(--muted)]">
                  {productsInCategory.length} product{productsInCategory.length === 1 ? "" : "s"}
                </span>
              </div>
              <h2 className="balance mt-4 max-w-[18ch] font-serif text-[clamp(32px,6.5vw,52px)] font-[440] leading-[0.96] tracking-[-0.025em] text-[var(--ink)]">
                {c.name}
              </h2>
              {c.description ? (
                <p className="mt-4 max-w-[52ch] font-serif text-[15px] leading-relaxed text-[var(--ink-2)]">{c.description}</p>
              ) : null}
              <div className="mt-6 h-[3px] w-14 bg-[var(--brand-blue)]" aria-hidden />
            </div>

            <div className="relative mt-8 aspect-[16/6] overflow-hidden border-y border-[var(--line-strong)] bg-[var(--paper-2)] sm:aspect-[16/5]">
              <CategoryImage slug={c.slug} name={c.name} imageUrl={c.image} className="object-cover" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 sm:px-12">
              <p className="label text-[9px] text-[var(--muted)]">Page {folioNum} &#183; Section {sectionNum}</p>
              <p className="label tabular-nums text-[9px] text-[var(--muted)]">{productsInCategory.length} items</p>
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

      {/* ── CLOSING PAGE ────────────────────────────────────── */}
      <section id="contact" className="catalogue-contact scroll-mt-28">
        <div className="px-6 py-12 sm:px-12 sm:py-16">
          <div className="flex items-center gap-4">
            <span className="label tabular-nums font-semibold text-[var(--brand-blue)]">{folio(total)}</span>
            <span className="h-px w-8 bg-[var(--brand-blue)]" aria-hidden />
            <span className="label text-[var(--muted)]">Closing page</span>
          </div>

          <div className="mt-4 grid gap-12 lg:grid-cols-[1fr_auto]">
            <div className="border-t-2 border-[var(--brand-blue)] pt-10">
              <p className="label text-[var(--brand-blue)]">Thank you</p>
              <h3 className="mt-3 font-serif text-[clamp(36px,7vw,60px)] font-[450] leading-none tracking-[-0.02em] text-[var(--ink)]">
                Let&apos;s connect.
              </h3>
              <p className="mt-6 max-w-[48ch] font-sans text-[14px] leading-relaxed text-[var(--ink-2)]">
                {settings.closing_message}
              </p>

              <address className="mt-10 max-w-xl space-y-3.5 not-italic font-sans text-[13px] leading-relaxed tracking-[0.03em] text-[var(--ink-2)]">
                <a className="flex items-start gap-3 transition-colors hover:text-[var(--brand-blue)]" href={`tel:${settings.contact_phone.replace(/[^+\d]/g, "")}`}>
                  <IconPhone size={16} stroke={1.6} className="mt-0.5 shrink-0 text-[var(--brand-blue)]" aria-hidden />
                  <span>{settings.contact_phone}</span>
                </a>
                <span className="flex items-start gap-3">
                  <IconMapPin size={16} stroke={1.6} className="mt-0.5 shrink-0 text-[var(--brand-blue)]" aria-hidden />
                  <span>{settings.contact_address}</span>
                </span>
                <a className="flex items-start gap-3 transition-colors hover:text-[var(--brand-blue)]" href={`mailto:${settings.contact_email}`}>
                  <IconMail size={16} stroke={1.6} className="mt-0.5 shrink-0 text-[var(--brand-blue)]" aria-hidden />
                  <span>{settings.contact_email}</span>
                </a>
                <a
                  className="flex items-start gap-3 transition-colors hover:text-[var(--brand-blue)]"
                  href={settings.website_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconWorld size={16} stroke={1.6} className="mt-0.5 shrink-0 text-[var(--brand-blue)]" aria-hidden />
                  <span>{settings.website_url.replace(/^https?:\/\//, "")}</span>
                </a>
              </address>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a
                  href={settings.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="catalogue-primary inline-flex items-center gap-2.5 px-7 py-3.5 label transition-colors"
                >
                  Visit website <span aria-hidden>→</span>
                </a>
                <a href="#cover" className="catalogue-secondary label px-7 py-3.5 transition-colors">
                  Back to cover
                </a>
              </div>
            </div>

            <aside className="lg:pt-10">
              <div className="w-fit border border-[var(--line-strong)] bg-white p-4 shadow-[0_14px_40px_rgba(23,32,29,0.12)]">
                <QRCodeSVG value={settings.website_url} size={168} bgColor="#ffffff" fgColor="#0d3970" includeMargin />
                <p className="mt-3 max-w-[20ch] text-center label text-[var(--brand-blue)]">
                  Scan to view the catalogue online
                </p>
              </div>
              <p className="mt-7 label text-[9.5px] text-[var(--muted)]">Edition</p>
              <p className="mt-2 font-serif text-[15px] leading-relaxed text-[var(--ink)]">
                GEA Product Catalogue &#8212; Edition One, 2026
                <br />
                {products.length} products &#183; {categories.length} sections
              </p>
            </aside>
          </div>
        </div>
      </section>

      <FolioFooter left="GEA catalogue — 2026" right={`Page ${folio(total)} / ${folio(total)}`} />

      <PageNav sectionIds={sectionIds} />
    </CatalogueShell>
  );
}