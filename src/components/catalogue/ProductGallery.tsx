"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/supabase-types";
import { ProductImage as ProductImageFallback } from "./ProductImage";

type Props = {
  slug: string;
  name: string;
  imageUrl?: string | null;
  images?: ProductImage[];
};

export function ProductGallery({ slug, name, imageUrl, images = [] }: Props) {
  const gallery = images.length
    ? images
    : imageUrl
      ? [{ id: "primary", image_url: imageUrl, display_order: 0, is_primary: true } as ProductImage]
      : [];
  const [selectedId, setSelectedId] = useState(gallery[0]?.id ?? "primary");
  const selected = gallery.find((image) => image.id === selectedId) ?? gallery[0];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden border border-[var(--line)] bg-[var(--paper-2)] sm:aspect-[16/10]">
        {selected ? (
          <Image
            src={selected.image_url}
            alt={name}
            fill
            priority
            sizes="(min-width: 640px) 836px, 100vw"
            className="object-contain p-[5%]"
          />
        ) : (
          <ProductImageFallback slug={slug} name={name} imageUrl={null} fill className="object-contain p-[5%]" />
        )}
      </div>

      {gallery.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto" aria-label={`${name} images`}>
          {gallery.map((image, index) => {
            const active = image.id === selected?.id;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedId(image.id)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden border bg-[var(--paper-2)] ${
                  active ? "border-[var(--accent)]" : "border-[var(--line)]"
                }`}
                aria-label={`View image ${index + 1}`}
                aria-pressed={active}
              >
                <Image src={image.image_url} alt="" fill sizes="56px" className="object-contain p-1" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
