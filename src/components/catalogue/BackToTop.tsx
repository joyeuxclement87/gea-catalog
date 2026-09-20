"use client";
import { useEffect, useState } from "react";
import { IconArrowUp } from "@tabler/icons-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Back to top"
      className={`print-hidden fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-[0_10px_26px_rgba(13,57,112,0.4)] transition-[opacity,transform,background-color] duration-300 hover:bg-[var(--brand-blue-dark)] sm:right-8 sm:h-10 sm:w-10 ${
        visible
          ? "bottom-24 translate-y-0 opacity-100 sm:bottom-8"
          : "pointer-events-none bottom-24 translate-y-3 opacity-0 sm:bottom-8"
      }`}
    >
      <IconArrowUp size={18} stroke={2.2} aria-hidden />
    </button>
  );
}