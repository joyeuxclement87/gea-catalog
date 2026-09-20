import Image from "next/image";
import { ProductPlaceholder, CategoryPlaceholder, CoverPlaceholder } from "./Placeholder";

type ProductImageProps = {
  slug: string;
  name: string;
  imageUrl?: string | null;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function ProductImage({ name, imageUrl, fill, className, sizes, priority }: ProductImageProps) {
  const src = imageUrl;
  if (!src) return <ProductPlaceholder />;
  return (
    <Image
      src={src}
      alt={name}
      fill={fill}
      width={fill ? undefined : 800}
      height={fill ? undefined : 800}
      sizes={sizes ?? "(min-width: 640px) 272px, 46vw"}
      className={className}
      loading={priority ? undefined : "lazy"}
      decoding="async"
      priority={priority}
    />
  );
}

export function CoverImage({ priority, className, imageUrl }: { priority?: boolean; className?: string; imageUrl?: string | null }) {
  const src = imageUrl;
  if (!src) return <CoverPlaceholder />;
  return (
    <Image
      src={src}
      alt="Product catalogue cover"
      fill
      sizes="(min-width: 640px) 836px, 100vw"
      className={className}
      priority={priority}
      decoding="async"
    />
  );
}

export function CategoryImage({ slug, name, className, imageUrl }: { slug: string; name: string; className?: string; imageUrl?: string | null }) {
  const src = imageUrl;
  if (!src) return <CategoryPlaceholder name={name} />;
  return (
    <Image
      src={src}
      alt={`${name} — section cover`}
      fill
      sizes="(min-width: 640px) 900px, 100vw"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}