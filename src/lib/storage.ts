import { createServiceClient } from './supabase';

const supabase = createServiceClient();

export const STORAGE_BUCKETS = {
  products: 'product-images',
  categories: 'category-images',
  cover: 'catalogue-cover',
  sections: 'catalogue-sections',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

export async function ensureBucketsExist() {
  const buckets = Object.values(STORAGE_BUCKETS);
  for (const bucket of buckets) {
    const { data: existing } = await supabase.storage.getBucket(bucket);
    if (!existing) {
      await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
    }
  }
}

export async function uploadImage(
  bucket: StorageBucket,
  path: string,
  file: Buffer,
  contentType: string
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) return { error: error.message };

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { path: data.path, publicUrl: publicUrlData.publicUrl };
}

export async function deleteImage(bucket: StorageBucket, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function generateProductImagePath(productSlug: string, originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${productSlug}.${ext}`;
}

export function generateCategoryImagePath(categorySlug: string, originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${categorySlug}.${ext}`;
}

export function generateCoverImagePath(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `cover.${ext}`;
}