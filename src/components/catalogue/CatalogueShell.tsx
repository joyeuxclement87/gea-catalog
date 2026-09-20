import type { ReactNode } from "react";

export function CatalogueShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--desk)]">
      <div className="mx-auto max-w-[1360px] px-0 py-0 sm:px-4 sm:py-14 lg:py-24">
        <div className="paper-shadow animate-[paper-in_0.55s_ease-out] bg-white">{children}</div>

        {/* para-document note below the sheet */}
        <p className="mx-auto hidden max-w-[1360px] px-4 pt-6 font-sans text-[10.5px] uppercase leading-relaxed tracking-[0.1em] text-[var(--muted)] sm:block">
          This catalogue is a document. Prices, availability and specifications are subject to confirmation. For
          quotations and technical sheets contact the catalogue desk.
        </p>
        <div className="h-4 sm:h-0" />
      </div>
    </div>
  );
}

export function Hairline() {
  return <div className="h-px w-px bg-[var(--ink)]" aria-hidden />;
}

export function FolioFooter({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 pb-8 pt-10 sm:px-12">
      <span className="label text-[var(--muted)]">{left}</span>
      <span className="label tabular-nums text-[var(--muted)]">{right}</span>
    </div>
  );
}
