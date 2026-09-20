import Link from "next/link";
import { CatalogueShell } from "@/components/catalogue/CatalogueShell";

export default function NotFound() {
  return (
    <CatalogueShell>
      <div className="px-6 py-20 text-center sm:px-8 sm:py-28">
        <p className="label text-[var(--muted)]">404 &#8212; Not found</p>
        <h1 className="balance mx-auto mt-5 max-w-[22ch] font-serif text-[clamp(24px,5vw,34px)] font-[460] leading-tight tracking-[-0.02em] text-[var(--ink)]">
          This page does not exist in the catalogue.
        </h1>
        <p className="mx-auto mt-4 max-w-[42ch] font-sans text-[13.5px] leading-relaxed text-[var(--ink-2)]">
          The product or section you are looking for is not in this edition.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
          <Link href="/catalogue#contents" className="label text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-8 transition-colors hover:text-[var(--accent)]">
            Back to contents
          </Link>
          <Link href="/catalogue" className="label text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
            Front cover
          </Link>
        </div>
      </div>
    </CatalogueShell>
  );
}