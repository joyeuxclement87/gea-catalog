import type { Category, CatalogueSection, Product } from "@/lib/supabase-types";
import Image from "next/image";
import { IconMail, IconMapPin, IconPhone, IconWorld } from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { getCatalogueSettings } from "@/lib/catalog-settings";
import { ProductPlaceholder, CategoryPlaceholder, CoverPlaceholder } from "./Placeholder";
import { PrintImage } from "./PrintImage";
import { getCoverFeatures } from "@/lib/cover-features";

type Props = {
  categories: Category[];
  products: Product[];
  sections?: CatalogueSection[];
};

/**
 * Dedicated print document rendered at /catalogue/print. Uses the exact same
 * Supabase data as the web catalogue, with print-first CSS: A4 pages, explicit
 * page breaks, cards kept together, and the running footer page numbers.
 */
export async function CataloguePrint({ categories, products, sections = [] }: Props) {
  const byCategory = (slug: string) => products.filter((p) => p.categorySlug === slug);
  const settings = await getCatalogueSettings();
  const coverImage = settings.cover_image_url || "/images/cover/cover.jpg";
  const coverFeatures = getCoverFeatures(categories, products);

  return (
    <div className="pdf-root mx-auto max-w-[1280px] bg-white">
      {/* ── COVER ─────────────────────────────────────────────── */}
      <section className="pdf-page pdf-cover">
        <div className="flex items-start justify-between gap-6">
          <Image
            src="/GEA - logo.png"
            alt="GEA"
            width={3480}
            height={1588}
            className="h-9 w-auto"
            priority
          />
          <div className="pt-1 text-right">
            <p className="pdf-label text-[var(--brand-blue)]">
              Global Engineering Agency
            </p>
            <p className="pdf-label mt-2 text-[var(--muted)]">Edition 2026</p>
          </div>
        </div>

        <div className="mt-[26mm]">
          <p className="pdf-label font-semibold tracking-[0.34em] text-[var(--brand-blue)]">GEA</p>
          <h1 className="pdf-cover-title mt-3 font-serif font-[700] leading-none tracking-[-0.03em] text-[var(--brand-blue)]">
            Product Catalogue
          </h1>
          <div className="mt-[7mm] h-[3px] w-14 bg-[var(--brand-blue)]" aria-hidden />
          <p className="pdf-cover-intro mt-[6mm] max-w-[42ch] font-serif leading-relaxed text-[var(--ink-2)]">
            A considered selection of products for building, engineering, safety and everyday infrastructure.
          </p>
          <p className="pdf-label mt-[9mm] tabular-nums text-[var(--brand-blue)]">
            2026 &#183; {String(products.length).padStart(3, "0")} products
          </p>
        </div>

        {/* frontispiece plate — cover shot in a drafting mat with blueprint
            grid and corner crop marks, matching the section plates */}
        <div className="pdf-cover-image-wrap relative mt-[10mm]">
          <div>
            <PrintImage src={coverImage} alt="Product catalogue cover" className="h-full w-full object-cover" fallback={<CoverPlaceholder />} />
          </div>
        </div>
        <p className="pdf-label mt-[3mm] flex items-center gap-3 text-[var(--muted)]">
          <span>Fig. 00 &#8212; Frontispiece</span>
          <span className="h-px flex-1 border-b border-dotted border-[var(--line-strong)]" aria-hidden />
          <span className="text-[var(--brand-blue)]">GEA &#183; 2026</span>
        </p>

        {/* two-tone feature strip — real product/category photos, branded
            blocks as fallback so the band is always full and intentional */}
        <div className="pdf-strip mt-[5mm]">
          {coverFeatures.map((feature, i) => (
            <div
              key={`${i}-${feature.label}`}
              className={`pdf-strip-tile ${feature.tone === "blue" ? "pdf-strip-tile--blue" : "pdf-strip-tile--paper"}`}
            >
              {feature.image ? (
                <PrintImage
                  src={feature.image}
                  alt={feature.label}
                  className="h-full w-full object-cover"
                  fallback={<div className="h-full w-full" />}
                />
              ) : (
                <div className="h-full w-full" />
              )}
              <div className="pdf-strip-scrim" aria-hidden />
              <p className="pdf-strip-caption">
                <span className="pdf-strip-label">{feature.label}</span>
                <span className="pdf-strip-caption-txt">{feature.caption}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-[7mm]">
          <p className="pdf-label text-[var(--brand-blue)]">General Engineering</p>
          <p className="pdf-label tabular-nums text-[var(--muted)]">Catalogue 2026</p>
        </div>
      </section>

      {/* ── CONTENTS ──────────────────────────────────────────── */}
      <section className="pdf-page pdf-contents">
        <div className="flex items-center gap-4">
          <span className="pdf-label tabular-nums font-semibold text-[var(--brand-blue)]">02</span>
          <span className="h-px w-8 bg-[var(--brand-blue)]" aria-hidden />
          <span className="pdf-label text-[var(--muted)]">Table of contents</span>
        </div>

        <h2 className="pdf-contents-title mt-[6mm] font-serif font-[440] leading-none tracking-[-0.02em] text-[var(--ink)]">
          Contents
        </h2>

        <ol className="mt-[9mm] border-t border-[var(--ink)]">
          {categories.map((c, i) => {
            const count = c.productCount ?? products.filter((p) => p.categorySlug === c.slug).length;
            return (
              <li key={c.slug} className="flex items-center gap-5 border-b border-[var(--line)] py-[5mm]">
                <span className="w-9 shrink-0 pdf-label tabular-nums font-semibold text-[var(--brand-blue)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-serif text-[15pt] font-[470] leading-snug tracking-[-0.01em] text-[var(--ink)]">
                    {c.name}
                  </span>
                  <span className="pdf-label text-[var(--muted)]">
                    {count} product{count === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="ml-auto h-px flex-1 border-b border-dotted border-[var(--line-strong)]" aria-hidden />
                <span className="shrink-0 pdf-label text-[var(--brand-blue)]">Section {String(i + 1).padStart(2, "0")}</span>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between pt-[6mm]">
          <p className="pdf-label text-[var(--muted)]">{products.length} products in total</p>
          <p className="pdf-label tabular-nums text-[var(--muted)]">{categories.length} sections</p>
        </div>
      </section>

      {/* ── EDITORIAL SECTIONS (product-less dividers) ────────── */}
      {sections.map((section, i) => {
        const sectionNum = String(i + 1).padStart(2, "0");
        return (
          <section key={section.id} className="pdf-page pdf-section">
            <div className="pdf-runhead">
              <p className="pdf-label text-[var(--blue-tint-muted)]">
                Catalogue section &#8212; {section.title}
              </p>
              <p className="pdf-label text-[var(--blue-tint-muted)]">GEA &#183; 2026</p>
            </div>

            <div className="pdf-opener">
              <div>
                <div className="flex items-center gap-4">
                  <span className="pdf-label tabular-nums font-semibold text-[var(--blue-tint)]">{sectionNum}</span>
                  <span className="h-px w-8 bg-[var(--blue-tint)]" aria-hidden />
                  <span className="pdf-label text-[var(--blue-tint-muted)]">Catalogue section</span>
                </div>
                <h2 className="pdf-section-title mt-[6mm] max-w-[20ch] font-serif font-[440] leading-[0.96] text-white">
                  {section.title}
                </h2>
                {section.description ? (
                  <p className="pdf-section-intro mt-[5mm] max-w-[46ch] font-sans leading-[1.7] text-white/85">
                    {section.description}
                  </p>
                ) : null}
                <div className="mt-[7mm] flex items-center gap-3">
                  <span className="h-[3px] w-12 bg-[var(--blue-tint)]" aria-hidden />
                  <span className="h-px flex-1 bg-white/20" aria-hidden />
                </div>
              </div>

              <figure className="pdf-plate">
                <div className="pdf-plate-frame">
                  <div>
                    {section.image_url ? (
                      <PrintImage src={section.image_url} alt={section.title} className="h-full w-full" fallback={<CategoryPlaceholder name={section.title} />} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="pdf-label text-[var(--blue-tint)]">GEA &#183; {section.title}</span>
                      </div>
                    )}
                  </div>
                </div>
                <figcaption className="pdf-label pt-[2.5mm] text-[var(--blue-tint-muted)]">
                  Fig. {sectionNum} &#8212; {section.title} &#183; GEA section
                </figcaption>
              </figure>
            </div>
          </section>
        );
      })}

      {/* ── CATEGORY SECTIONS ─────────────────────────────────── */}
      {categories.map((c, i) => {
        const productsInCategory = byCategory(c.slug);
        const sectionNum = String(i + 1).padStart(2, "0");
        const count = productsInCategory.length;
        return (
          <section key={c.slug} className="pdf-page pdf-category">
            <div className="pdf-runhead">
              <p className="pdf-label text-[var(--blue-tint-muted)]">
                Section {sectionNum} &#8212; {c.name}
              </p>
              <p className="pdf-label tabular-nums text-[var(--blue-tint-muted)]">{count} items</p>
            </div>

            <div className="pdf-opener">
              <div>
                <div className="flex items-center gap-4">
                  <span className="pdf-label tabular-nums font-semibold text-[var(--blue-tint)]">{sectionNum}</span>
                  <span className="h-px w-8 bg-[var(--blue-tint)]" aria-hidden />
                  <span className="pdf-label text-[var(--blue-tint-muted)]">
                    {count} product{count === 1 ? "" : "s"} in this section
                  </span>
                </div>
                <h2 className="pdf-category-title mt-[5mm] max-w-[18ch] font-serif font-[440] leading-[0.96] tracking-[-0.02em] text-white">
                  {c.name}
                </h2>
                {c.description ? (
                  <p className="pdf-category-intro mt-[4mm] max-w-[46ch] font-sans leading-[1.7] text-white/85">
                    {c.description}
                  </p>
                ) : null}
                <div className="mt-[6.5mm] flex items-center gap-3">
                  <span className="h-[3px] w-12 bg-[var(--blue-tint)]" aria-hidden />
                  <span className="h-px flex-1 bg-white/20" aria-hidden />
                </div>
              </div>

              <figure className="pdf-plate">
                <div className="pdf-plate-frame">
                  <div>
                    <PrintImage src={c.image} alt={`${c.name} — section cover`} className="h-full w-full" fallback={<CategoryPlaceholder name={c.name} />} />
                  </div>
                </div>
                <figcaption className="pdf-label pt-[2.5mm] text-[var(--blue-tint-muted)]">
                  Fig. {sectionNum} &#8212; {c.name} &#183; {count} items
                </figcaption>
              </figure>
            </div>

            <div className="pdf-grid mt-[6mm]">
              {productsInCategory.map((p) => (
                <article key={p.id} className="pdf-card border border-[var(--line)] bg-white">
                  <div className="pdf-card-img relative border-b border-[var(--line)] bg-[var(--paper-2)]">
                    <PrintImage
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-contain p-[8%]"
                      fallback={<ProductPlaceholder />}
                    />
                  </div>
                  <div className="flex min-h-[18mm] flex-col justify-between gap-2 px-[4mm] py-[3.5mm]">
                    <h3 className="font-serif text-[11.5pt] font-[480] leading-[1.2] tracking-[-0.015em] text-[var(--ink)]">
                      {p.name}
                    </h3>
                    <p className="pdf-label text-[var(--muted)]">{p.category?.name ?? p.categorySlug}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {/* ── CONTACT / CLOSING PAGE ────────────────────────────── */}
      <section className="pdf-page pdf-contact">
        <div className="flex items-center gap-4">
          <span className="pdf-label tabular-nums font-semibold text-[var(--brand-blue)]">
            {String(categories.length + sections.length + 3).padStart(2, "0")}
          </span>
          <span className="h-px w-8 bg-[var(--brand-blue)]" aria-hidden />
          <span className="pdf-label text-[var(--muted)]">Closing page</span>
        </div>

        <div className="mt-[10mm] grid gap-[14mm] lg:grid-cols-[1fr_auto]">
          <div className="border-t-2 border-[var(--brand-blue)] pt-[9mm]">
            <p className="pdf-label text-[var(--brand-blue)]">Thank you</p>
            <h3 className="mt-[4mm] font-serif text-[30pt] font-[450] leading-none tracking-[-0.02em] text-[var(--ink)]">
              Let&apos;s connect.
            </h3>
            <p className="pdf-contact-intro mt-[6mm] max-w-[48ch] font-sans leading-relaxed text-[var(--ink-2)]">
              {settings.closing_message}
            </p>

            <address className="mt-[9mm] max-w-xl space-y-[4mm] font-sans not-italic leading-relaxed tracking-[0.03em] text-[var(--ink-2)]">
              <span className="flex items-start gap-3">
                <IconPhone size={15} stroke={1.6} className="mt-0.5 shrink-0 text-[var(--brand-blue)]" aria-hidden />
                <span>{settings.contact_phone}</span>
              </span>
              <span className="flex items-start gap-3">
                <IconMapPin size={15} stroke={1.6} className="mt-0.5 shrink-0 text-[var(--brand-blue)]" aria-hidden />
                <span>{settings.contact_address}</span>
              </span>
              <span className="flex items-start gap-3">
                <IconMail size={15} stroke={1.6} className="mt-0.5 shrink-0 text-[var(--brand-blue)]" aria-hidden />
                <span>{settings.contact_email}</span>
              </span>
              <span className="flex items-start gap-3">
                <IconWorld size={15} stroke={1.6} className="mt-0.5 shrink-0 text-[var(--brand-blue)]" aria-hidden />
                <span>{settings.website_url.replace(/^https?:\/\//, "")}</span>
              </span>
            </address>
          </div>

          <aside>
            <div className="w-fit border border-[var(--line-strong)] bg-white p-[6mm]">
              <QRCodeSVG value={settings.website_url} size={150} bgColor="#ffffff" fgColor="#0d3970" includeMargin />
              <p className="pdf-label mt-[4mm] max-w-[20ch] text-center text-[var(--brand-blue)]">
                Scan to view the catalogue online
              </p>
            </div>
            <p className="pdf-label mt-[7mm] text-[var(--muted)]">Edition</p>
            <p className="mt-[2.5mm] font-serif text-[13pt] leading-relaxed text-[var(--ink)]">
              GEA Product Catalogue &#8212; Edition One, 2026
              <br />
              {products.length} products &#183; {categories.length} sections
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}