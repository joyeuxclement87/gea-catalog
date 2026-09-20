import Link from "next/link";
import type { Product } from "@/lib/supabase-types";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/catalogue/${product.categorySlug}/${product.slug}`}
      className="catalogue-product-card group flex h-full flex-col border border-[var(--line)] bg-white transition-[border-color,box-shadow] duration-200 hover:border-[var(--brand-blue)]/70 hover:shadow-[0_10px_24px_rgba(13,57,112,0.1)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden border-b border-[var(--line)] bg-[var(--paper-2)]">
        <ProductImage
          slug={product.slug}
          name={product.name}
          imageUrl={product.image}
          fill
          className="object-contain p-[8%] transition-transform duration-500 group-hover:scale-[1.045]"
        />
      </div>
      <div className="flex min-h-[86px] flex-1 flex-col justify-between gap-2.5 px-3.5 py-3.5 sm:min-h-[94px] sm:px-4 sm:py-4">
        <h3 className="line-clamp-2 font-serif text-[13.5px] font-[480] leading-[1.25] tracking-[-0.015em] text-[var(--ink)] transition-colors group-hover:text-[var(--brand-blue-dark)] sm:text-[15px]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="label text-[9px] text-[var(--muted)]">
            {product.category?.name ?? product.categorySlug}
          </span>
          <span
            className="label inline-flex items-center gap-1 text-[9.5px] font-semibold text-[var(--brand-blue)]"
            aria-hidden
          >
            View
            <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}