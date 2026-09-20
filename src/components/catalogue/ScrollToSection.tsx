"use client";
import { useEffect } from "react";

export function ScrollToSection({ id }: { id: string }) {
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [id]);
  return null;
}