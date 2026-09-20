import Link from "next/link";
import type { Product } from "@/lib/supabase-types";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/catalogue/${product.categorySlug}/${product.slug}`}
      className="group flex h-full flex-col border border-[var(--line)] bg-white transition-colors duration-200 hover:border-[var(--accent)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden border-b border-[var(--line)] bg-[var(--paper-2)]">
        <ProductImage
          slug={product.slug}
          name={product.name}
          imageUrl={product.image}
          fill
          className="object-contain p-[7%] transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3 px-5 py-5 min-h-[96px]">
        <h3 className="line-clamp-2 font-serif text-[15.5px] font-[480] leading-[1.24] tracking-[-0.015em] text-[var(--ink)]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="label text-[9px] text-[var(--muted)]">
            {product.category?.name ?? product.categorySlug}
          </span>
          <span
            className="label tabular-nums text-[9px] text-[var(--ink-2)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden
          >
            View &#8594;
          </span>
        </div>
      </div>
    </Link>
  );
}
