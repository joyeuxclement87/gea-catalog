import type { Metadata } from "next";
import { Manrope, DM_Serif_Display } from "next/font/google";
import { getCategories, getProducts, getOrderedCategories } from "@/lib/catalog-supabase";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const products = await getProducts();
  const categories = getOrderedCategories(await getCategories());
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gea-catalog.local";
  return {
    title: {
      default: "GEA — Product Catalogue 2026",
      template: "%s — GEA Catalogue",
    },
    description: `GEA Product Catalogue 2026 — ${products.length} products across ${categories.length} sections: aluminium, electrical, fire fighting, plumbing, safety, security, tiles & sanitary wares. A document-first catalogue, not an online store.`,
    metadataBase: new URL(siteUrl),
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
