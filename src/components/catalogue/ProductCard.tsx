import Link from "next/link";
import type { Product } from "@/lib/supabase-types";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/catalogue/${product.categorySlug}/${product.slug}`}
      className="catalogue-product-card group flex h-full flex-col border border-[var(--line)] bg-white transition-[border-color,box-shadow] duration-200 hover:border-[var(--accent)] hover:shadow-[0_8px_20px_rgba(23,32,29,0.08)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden border-b border-[var(--line)] bg-[var(--paper-2)]">
        <ProductImage
          slug={product.slug}
          name={product.name}
          imageUrl={product.image}
          fill
          className="object-contain p-[8%] transition-transform duration-500 group-hover:scale-[1.035]"
        />
      </div>
      <div className="flex min-h-[92px] flex-1 flex-col justify-between gap-2.5 px-3.5 py-3.5 sm:min-h-[104px] sm:gap-3 sm:px-5 sm:py-4">
        <h3 className="line-clamp-2 font-serif text-[14px] font-[480] leading-[1.24] tracking-[-0.015em] text-[var(--ink)] sm:text-[15.5px]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="label text-[9px] text-[var(--muted)]">
            {product.category?.name ?? product.categorySlug}
          </span>
          <span
            className="label tabular-nums text-[9px] text-[var(--brand-blue)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden
          >
            View &#8594;
          </span>
        </div>
      </div>
    </Link>
  );
}
