"use client";
import { useEffect, useState } from "react";
import { IconArrowUp } from "@tabler/icons-react";

/**
 * Global "back to top" control for long admin pages. Hidden near the top,
 * appears after ~400px of scrolling, smooth-scrolls to the top.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
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
      title="Back to top"
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-[0_10px_26px_rgba(13,57,112,0.35)] transition-[opacity,transform,background-color] duration-300 hover:bg-[var(--brand-blue-dark)] focus-visible:outline-2 focus-visible:outline-[var(--brand-blue)] ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <IconArrowUp size={18} stroke={2.2} aria-hidden />
    </button>
  );
}