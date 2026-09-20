"use client";

import { useState, type ReactNode } from "react";

/**
 * Print-only image: renders a plain <img> (no Next.js optimisation) inside a
 * branded placeholder slot. If the URL is missing or fails to load, the
 * branded placeholder is shown instead of a broken-image icon — one broken
 * image must never ruin the generated PDF.
 */
export function PrintImage({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className="flex h-full w-full items-center justify-center overflow-hidden">{fallback}</div>;
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={className} onError={() => setFailed(true)} draggable={false} />
    </div>
  );
}