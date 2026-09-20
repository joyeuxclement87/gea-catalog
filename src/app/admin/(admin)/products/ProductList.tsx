'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductImageManager from '@/components/admin/ProductImageManager';

interface ProductListProps {
  products: any[];
  categories: any[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  categoryId: string;
  status: string;
  sort: string;
  action?: string;
}

const inputClass =
  'w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

export default function ProductList({
  products,
  categories,
  total,
  page,
  totalPages,
  search,
  categoryId,
  status,
  sort,
  action,
}: ProductListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreate, setShowCreate] = useState(action === 'create');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function buildQuery(params: Record<string, string | undefined>) {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    return newParams.toString();
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = buildQuery({ search: formData.get('search') as string, page: '1' });
    router.push(`/admin/products?${query}`);
  }

  function handleFilterChange(key: string, value: string) {
    const query = buildQuery({ [key]: value || undefined, page: '1' });
    router.push(`/admin/products?${query}`);
  }

  function handlePageChange(newPage: number) {
    const query = buildQuery({ page: String(newPage) });
    router.push(`/admin/products?${query}`);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    setLoading(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
    setDeletingId(null);
  }

  async function handleStatusToggle(product: any) {
    setLoading(true);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: product.status === 'published' ? 'draft' : 'published' }),
    });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  if (showCreate || editingProduct) {
    return (
      <ProductForm
        product={editingProduct}
        categories={categories}
        onClose={() => {
          setShowCreate(false);
          setEditingProduct(null);
          router.push('/admin/products');
        }}
        onSuccess={() => router.refresh()}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">
            Products
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{total} products total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--paper)] transition-colors hover:bg-[var(--brand-blue-dark)]"
        >
          Add Product
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
        <div className="min-w-[250px] flex-1">
          <input
            name="search"
            type="search"
            placeholder="Search products…"
            defaultValue={search}
            className={inputClass}
          />
        </div>
        <select
          name="category"
          value={categoryId}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className={`${inputClass} w-auto`}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          name="status"
          value={status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className={`${inputClass} w-auto`}
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          name="sort"
          value={sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className={`${inputClass} w-auto`}
          aria-label="Sort products"
        >
          <option value="updated">Recently updated</option>
          <option value="created">Recently added</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
      </form>

      <div className="overflow-hidden border border-[var(--line)] bg-[var(--paper)]">
        <table className="w-full">
          <thead className="border-b border-[var(--line-strong)] bg-[var(--paper-2)]">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Product</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Category</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Images</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Status</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Price</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-[var(--paper-2)]">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-12 w-12 border border-[var(--line)] object-contain" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center border border-[var(--line)] bg-[var(--paper-2)]">
                        <span className="text-xs text-[var(--muted-2)]">No image</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-[var(--ink)]">{product.name}</p>
                      <p className="text-xs text-[var(--muted)]">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--ink-2)]">{product.category?.name || '—'}</td>
                <td className="px-4 py-4 text-sm text-[var(--ink-2)]">{product.product_images?.length ?? (product.image ? 1 : 0)} images</td>
                <td className="px-4 py-4">
                  <StatusBadge status={product.status} />
                </td>
                <td className="px-4 py-4 text-sm text-[var(--ink-2)]">
                  {product.price ? `$${product.price.toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-sm font-medium text-[var(--accent)] underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:text-[var(--ink)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleStatusToggle(product)}
                      disabled={loading}
                      className={`text-sm font-medium underline decoration-[var(--line-strong)] underline-offset-2 transition-colors ${
                        product.status === 'published'
                          ? 'text-[var(--muted)] hover:text-[var(--ink)]'
                          : 'text-[#2f5d52] hover:text-[var(--ink)]'
                      }`}
                    >
                      {product.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => setDeletingId(product.id)}
                      disabled={loading}
                      className="text-sm font-medium text-[#8a2f1b] underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:text-[#6e2514]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="p-12 text-center text-[var(--muted)]">No products found</div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3">
            <p className="text-sm text-[var(--muted)]">
              Page {page} of {totalPages} — {total} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="border border-[var(--line-strong)] px-3 py-1 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="border border-[var(--line-strong)] px-3 py-1 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md border border-[var(--line-strong)] bg-[var(--paper)] p-6">
            <h3 className="font-serif text-[22px] text-[var(--ink)]">Delete product?</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="border border-[var(--line-strong)] px-4 py-2 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={loading}
                className="bg-[#8a2f1b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6e2514] disabled:opacity-50"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium ${
        status === 'published'
          ? 'bg-[var(--brand-blue-light)] text-[var(--brand-blue-dark)]'
          : 'bg-[var(--paper-2)] text-[var(--muted)] border border-[var(--line-strong)]'
      }`}
    >
      {status}
    </span>
  );
}

function ProductForm({
  product,
  categories,
  onClose,
  onSuccess,
}: {
  product: any | null;
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    category_id: product?.category_id ?? '',
    image: product?.image ?? '',
    description: product?.description ?? '',
    price: product?.price ? String(product.price) : '',
    sku: product?.sku ?? '',
    status: product?.status ?? 'published',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null,
    };

    const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products';
    const method = product ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
      setError(result.error || 'Failed to save');
      setLoading(false);
      return;
    }

    if (!product && pendingImages.length > 0) {
      for (const file of pendingImages) {
        const imageForm = new FormData();
        imageForm.append('file', file);
        const imageResponse = await fetch(`/api/admin/products/${result.id}/images`, {
          method: 'POST',
          body: imageForm,
        });
        if (!imageResponse.ok) {
          const imageResult = await imageResponse.json();
          setError(imageResult.error || 'Product saved, but an image upload failed.');
          setLoading(false);
          return;
        }
      }
    }

    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-y-auto border border-[var(--line-strong)] bg-[var(--paper)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] p-6">
          <h2 className="font-serif text-[24px] text-[var(--ink)]">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-2xl leading-none text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="border border-[#c9b0a6] bg-[#f6ece6] p-3 text-sm text-[#8a2f1b]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Name *</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Slug *</label>
            <input
              name="slug"
              type="text"
              value={formData.slug}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Category *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Image URL</label>
            <input
              name="image"
              type="text"
              value={formData.image}
              onChange={handleChange}
              className={inputClass}
            />
            {formData.image && (
              <img src={formData.image} alt="Preview" className="mt-2 max-h-32 border border-[var(--line)]" />
            )}
          </div>

          {product ? (
            <ProductImageManager
              productId={product.id}
              initialImages={product.product_images ?? []}
            />
          ) : (
            <div className="border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-[22px] text-[var(--ink)]">Product images</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{pendingImages.length} / 5 images selected. You can manage them after saving.</p>
                </div>
                <label className="shrink-0 cursor-pointer border border-[var(--line-strong)] px-3 py-2 text-sm font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  Choose images
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const selected = Array.from(event.target.files ?? []).slice(0, 5);
                      setPendingImages(selected);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>
              {pendingImages.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {pendingImages.map((file) => <span key={`${file.name}-${file.size}`} className="border border-[var(--line)] bg-[var(--paper-2)] px-2 py-1 text-xs text-[var(--muted)]">{file.name}</span>)}
                </div>
              ) : null}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Price (optional)</label>
              <input
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">SKU (optional)</label>
              <input
                name="sku"
                type="text"
                value={formData.sku}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-5">
            <button type="button" onClick={onClose} className="border border-[var(--line-strong)] px-4 py-2 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)]">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--paper)] transition-colors hover:bg-[var(--brand-blue-dark)] disabled:opacity-50">
              {loading ? 'Saving…' : product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
