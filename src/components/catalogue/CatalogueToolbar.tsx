"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type SearchEntry = { name: string; href: string; category: string; image?: string | null };

export function CatalogueToolbar({ products }: { products: SearchEntry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const timer = useRef<number | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 12);
  }, [products, query]);

  const showPanel = focused && results !== null;

  async function downloadPdf() {
    setDownloading(true);
    try {
      const response = await fetch("/api/catalogue/pdf");
      if (!response.ok) throw new Error("PDF generation failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "gea-catalogue-2026.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="print-hidden sticky top-0 z-40 border-b border-[var(--line)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1360px] items-center gap-4 px-4 py-3 sm:gap-6 sm:px-8">
        <Link href="#cover" aria-label="Back to cover" className="shrink-0 leading-none">
          <Image
            src="/GEA - logo.png"
            alt="GEA"
            width={3480}
            height={1588}
            className="h-6 w-auto sm:h-7"
          />
        </Link>
        <span className="hidden h-4 w-px shrink-0 bg-[var(--line-strong)] sm:block" aria-hidden />

        <Link
          href="#contents"
          className="label hidden shrink-0 text-[var(--muted)] underline decoration-transparent underline-offset-8 transition-colors hover:text-[var(--ink)] hover:decoration-[var(--accent)] sm:block"
        >
          Contents
        </Link>

        <button
          type="button"
          onClick={downloadPdf}
          disabled={downloading}
          className="print-hidden catalogue-secondary label shrink-0 px-2.5 py-2 transition-colors disabled:cursor-wait disabled:opacity-60 sm:px-3"
          title="Save the catalogue as a PDF"
        >
          {downloading ? "Preparing PDF..." : "Download PDF"}
        </button>

        <div className="relative ml-auto w-full max-w-[320px]">
          <form
            role="search"
            action=""
            onSubmit={(e) => {
              e.preventDefault();
              if (results && results[0]) router.push(results[0].href);
            }}
            className="flex items-center gap-2 border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2 transition-colors focus-within:border-[var(--brand-blue)] focus-within:bg-white"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[var(--muted)]" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.8-3.8" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                if (timer.current) window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => setFocused(false), 140);
              }}
              type="search"
              enterKeyHint="search"
              placeholder="Search products"
              aria-label="Search the catalogue"
              className="w-full bg-transparent text-[13px] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="shrink-0 text-[11px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                ✕
              </button>
            )}
          </form>

          {showPanel && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] border border-[var(--line)] bg-white shadow-[0_18px_44px_rgba(20,18,12,0.14)]">
              {results!.length === 0 ? (
                <p className="px-4 py-4 font-serif text-[13px] italic text-[var(--muted)]">No products match that query.</p>
              ) : (
                <ul>
                  {results!.map((p) => (
                    <li key={p.href} className="border-b border-[var(--line)] last:border-0">
                      <Link href={p.href} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--paper-2)]">
                        <span className="relative h-9 w-9 shrink-0 overflow-hidden border border-[var(--line)] bg-[var(--paper-2)]">
                          {p.image ? <Image src={p.image} alt="" width={36} height={36} className="h-full w-full object-contain p-0.5" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-serif text-[14px] leading-snug text-[var(--ink)]">{p.name}</span>
                          <span className="label mt-0.5 block truncate text-[9px] text-[var(--brand-blue)]">{p.category}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
