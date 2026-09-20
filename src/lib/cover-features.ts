import type { Category, Product } from "./supabase-types";

export type CoverFeature = {
  /** Short display label shown on the tile. */
  label: string;
  /** Small caption line, e.g. "Catalogue section". */
  caption: string;
  /** Image URL, or null for a branded two-tone block. */
  image: string | null;
  /** Alternate tone so adjacent tiles form a two-tone rhythm. */
  tone: "blue" | "paper";
};

/**
 * Builds the tile list for the cover's two-tone feature strip. Real imagery is
 * preferred (category covers first, then product photos); any remaining slots
 * are filled with branded two-tone blocks labelled with section names, so the
 * strip always reads as intentional even when catalogue photos are scarce.
 */
export function getCoverFeatures(
  categories: Category[],
  products: Product[],
  count = 6,
): CoverFeature[] {
  const features: CoverFeature[] = [];
  const next = () => (features.length % 2 === 0 ? ("blue" as const) : ("paper" as const));

  for (const category of categories) {
    if (features.length >= count) break;
    if (category.image) {
      features.push({
        label: category.name,
        caption: "Catalogue section",
        image: category.image,
        tone: next(),
      });
    }
  }

  for (const product of products) {
    if (features.length >= count) break;
    if (product.image) {
      features.push({
        label: product.name,
        caption: product.category?.name ?? product.categorySlug,
        image: product.image,
        tone: next(),
      });
    }
  }

  // Fill remaining slots with labelled two-tone blocks so the strip is complete.
  let index = 0;
  while (features.length < count) {
    const category = categories[index % categories.length];
    features.push({
      label: category ? category.name : `GEA ${features.length + 1}`,
      caption: "Catalogue section",
      image: null,
      tone: next(),
    });
    index += 1;
  }

  return features.slice(0, count);
}