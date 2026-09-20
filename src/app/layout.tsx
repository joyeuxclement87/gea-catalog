import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import { getProducts, getOrderedCategories } from "@/lib/catalog";
import "./globals.css";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

export function generateMetadata(): Metadata {
  const products = getProducts();
  const categories = getOrderedCategories();
  return {
    title: {
      default: "GEA — Product Catalogue 2026",
      template: "%s — GEA Catalogue",
    },
    description: `GEA Product Catalogue 2026 — ${products.length} products across ${categories.length} sections: aluminium, electrical, fire fighting, plumbing, safety, security, tiles & sanitary wares. A document-first catalogue, not an online store.`,
    metadataBase: new URL("https://gea-catalog.local"),
    openGraph: {
      title: "GEA — Product Catalogue 2026",
      description: `${products.length} products across ${categories.length} trade sections. A printed catalogue, on the web.`,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full bg-[var(--desk)] text-[var(--ink)] antialiased">{children}</body>
    </html>
  );
}