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
    "flex items-center gap-1.5 rounded-full px-3 py-1.5 label text-[var(--ink)] transition-colors hover:bg-black/[0.05] disabled:opacity-25 disabled:hover:bg-transparent";

  return (
    <div className="print-hidden pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:pb-6">
      <nav
        className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-[var(--line-strong)] bg-white/95 py-1 pl-1 pr-1 shadow-[0_12px_36px_rgba(20,18,12,0.16)] backdrop-blur"
        aria-label="Catalogue pages"
      >
        <button type="button" onClick={() => canPrev && go(sectionIds[current - 1])} disabled={!canPrev} className={btn} aria-label="Previous section">
          <IconChevronLeft size={15} stroke={1.7} aria-hidden />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button type="button" onClick={() => go("contents")} className={`${btn} text-[var(--muted)] hover:text-[var(--ink)]`} aria-label="Open contents">
          <IconBook2 size={15} stroke={1.7} aria-hidden />
          <span className="hidden sm:inline">Contents</span>
        </button>
        <span className="px-2.5 label tabular-nums tracking-wide text-[var(--muted)]" aria-live="polite">
          <span className="font-medium text-[var(--ink)]">{folio(current + 1)}</span>
          <span className="text-[var(--muted-2)]"> / {folio(total)}</span>
        </span>
        <button type="button" onClick={() => canNext && go(sectionIds[current + 1])} disabled={!canNext} className={btn} aria-label="Next section">
          <span className="hidden sm:inline">Next</span>
          <IconChevronRight size={15} stroke={1.7} aria-hidden />
        </button>
        {showTop ? (
          <button type="button" onClick={goTop} className={`${btn} border-l border-[var(--line)] text-[var(--accent)]`} aria-label="Back to top" title="Back to top">
            <IconArrowUp size={15} stroke={1.7} aria-hidden />
          </button>
        ) : null}
      </nav>
    </div>
  );
}
