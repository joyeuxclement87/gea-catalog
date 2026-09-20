import { createServiceClient } from '@/lib/supabase';

export default async function MediaPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('product_images')
    .select('id, image_url, display_order, is_primary, created_at, product:products(name, slug)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">Media</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">A quiet overview of product images. Manage replacements and ordering from the product editor.</p>
      </div>

      {error ? (
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5 text-sm text-[var(--muted)]">
          Product media is ready after the product image migration is applied in Supabase.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(data ?? []).map((image: any) => (
            <article key={image.id} className="border border-[var(--line)] bg-[var(--paper)] p-2">
              <div className="relative aspect-square overflow-hidden bg-[var(--paper-2)]">
                <img src={image.image_url} alt={image.product?.name ?? 'Product image'} className="h-full w-full object-contain" />
              </div>
              <p className="mt-2 truncate text-sm font-medium text-[var(--ink)]">{image.product?.name ?? 'Unassigned product'}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{image.is_primary ? 'Primary image' : `Image ${image.display_order + 1}`}</p>
            </article>
          ))}
          {data?.length === 0 ? <p className="col-span-full border border-dashed border-[var(--line-strong)] p-10 text-center text-sm text-[var(--muted)]">No product media uploaded yet.</p> : null}
        </div>
      )}
    </div>
  );
}
