"use client";
import { useEffect, useState } from "react";
import { folio } from "@/lib/catalog";
import { IconArrowUp, IconBook2, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

type Props = { sectionIds: string[] };

export function PageNav({ sectionIds }: Props) {
  const [current, setCurrent] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const els = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = sectionIds.indexOf(visible.target.id);
          if (idx >= 0 && idx !== current) setCurrent(idx);
        }
      },
      { rootMargin: "-42% 0px -48% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIds]);

  const total = sectionIds.length;
  const canPrev = current > 0;
  const canNext = current < total - 1;

  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

  const goTop = () => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });

  const btn =
    "flex items-center gap-2 rounded-full px-4 py-2.5 text-[0.6875rem]! uppercase tracking-[0.14em] font-medium text-[var(--ink)] transition-colors hover:bg-black/[0.05] disabled:opacity-25 disabled:hover:bg-transparent";

  return (
    <div className="print-hidden pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center px-3 sm:bottom-14">
      <nav
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-white/95 py-2.5 pl-2.5 pr-2.5 shadow-[0_14px_40px_rgba(23,32,29,0.18)] backdrop-blur"
        aria-label="Catalogue pages"
      >
        <button type="button" onClick={() => canPrev && go(sectionIds[current - 1])} disabled={!canPrev} className={btn} aria-label="Previous section">
          <IconChevronLeft size={18} stroke={1.8} aria-hidden />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button type="button" onClick={() => go("contents")} className={`${btn} text-[var(--muted)] hover:text-[var(--ink)]`} aria-label="Open contents">
          <IconBook2 size={18} stroke={1.8} aria-hidden />
          <span className="hidden sm:inline">Contents</span>
        </button>
        <span className="px-3 text-[0.6875rem]! uppercase tracking-[0.16em] tabular-nums font-medium text-[var(--muted)]" aria-live="polite">
          <span className="font-semibold text-[var(--brand-blue)]">{folio(current + 1)}</span>
          <span className="text-[var(--muted-2)]"> / {folio(total)}</span>
        </span>
        <button type="button" onClick={() => canNext && go(sectionIds[current + 1])} disabled={!canNext} className={btn} aria-label="Next section">
          <span className="hidden sm:inline">Next</span>
          <IconChevronRight size={18} stroke={1.8} aria-hidden />
        </button>
        {showTop ? (
          <button type="button" onClick={goTop} className={`${btn} border-l border-[var(--line)] text-[var(--accent)]`} aria-label="Back to top" title="Back to top">
            <IconArrowUp size={18} stroke={1.8} aria-hidden />
          </button>
        ) : null}
      </nav>
    </div>
  );
}
