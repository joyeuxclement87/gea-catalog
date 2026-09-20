'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/admin/ImageUploader';

interface CategoryListProps {
  categories: any[];
}

const inputClass =
  'w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]';

export default function CategoryList({ categories: initialCategories }: CategoryListProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      status: formData.get('status') || 'published',
    };

    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.refresh();
      setShowCreate(false);
    }
    setLoading(false);
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCategory) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      status: formData.get('status') || 'published',
    };

    const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.refresh();
      setEditingCategory(null);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? This will also delete all products in it.')) return;
    setLoading(true);
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    setLoading(false);
    setDeletingId(null);
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    const newCategories = [...categories];
    const [moved] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, moved);

    const updates = newCategories.map((c, i) => ({ id: c.id, display_order: i }));
    setCategories(newCategories);

    await fetch('/api/admin/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
  }

  function moveUp(index: number) {
    if (index > 0) handleReorder(index, index - 1);
  }

  function moveDown(index: number) {
    if (index < categories.length - 1) handleReorder(index, index + 1);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">
            Categories
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{categories.length} categories</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--paper)] transition-colors hover:bg-[var(--brand-blue-dark)]"
        >
          Add Category
        </button>
      </div>

      {showCreate && (
        <CategoryForm
          onClose={() => setShowCreate(false)}
          onSuccess={() => router.refresh()}
          onCreated={(category) => {
            setShowCreate(false);
            setEditingCategory(category);
          }}
        />
      )}

      {editingCategory && (
        <CategoryForm
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => router.refresh()}
        />
      )}

      <div className="overflow-hidden border border-[var(--line)] bg-[var(--paper)]">
        <table className="w-full">
          <thead className="border-b border-[var(--line-strong)] bg-[var(--paper-2)]">
            <tr>
              <th className="w-12 px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Order</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Category</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Slug</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Status</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Products</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {categories.map((category, index) => (
              <tr key={category.id} className="hover:bg-[var(--paper-2)]">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="p-1 text-lg leading-none text-[var(--muted)] transition-colors hover:text-[var(--accent)] disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-[var(--ink)]">{category.display_order + 1}</span>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === categories.length - 1}
                      aria-label="Move down"
                      className="p-1 text-lg leading-none text-[var(--muted)] transition-colors hover:text-[var(--accent)] disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="h-10 w-10 border border-[var(--line)] object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center border border-[var(--line)] bg-[var(--paper-2)]">
                        <span className="text-xs text-[var(--muted-2)]">No img</span>
                      </div>
                    )}
                    <p className="font-medium text-[var(--ink)]">{category.name}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--muted)]">{category.slug}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={category.status} />
                </td>
                <td className="px-4 py-4 text-sm text-[var(--ink-2)]">{category.productCount || 0}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="text-sm font-medium text-[var(--accent)] underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:text-[var(--ink)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(category.id)}
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

        {categories.length === 0 && (
          <div className="p-12 text-center text-[var(--muted)]">No categories yet</div>
        )}
      </div>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md border border-[var(--line-strong)] bg-[var(--paper)] p-6">
            <h3 className="font-serif text-[22px] text-[var(--ink)]">Delete category?</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This will also delete all products in this category. Cannot be undone.
            </p>
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

function CategoryForm({
  category,
  onClose,
  onCreated,
  onSuccess,
}: {
  category?: any;
  onClose: () => void;
  onCreated?: (category: any) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    display_order: category?.display_order ?? 0,
    status: category?.status ?? 'published',
    image: category?.image ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const displayOrderValue = formData.display_order;
    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      display_order: parseInt(String(displayOrderValue)) || 0,
      status: formData.status,
      image: formData.image || null,
    };

    const url = category ? `/api/admin/categories/${category.id}` : '/api/admin/categories';
    const method = category ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save');
      setLoading(false);
      return;
    }

    const saved = await res.json();
    if (category) {
      onSuccess();
      onClose();
    } else {
      onCreated?.(saved);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-y-auto border border-[var(--line-strong)] bg-[var(--paper)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] p-6">
          <h2 className="font-serif text-[24px] text-[var(--ink)]">
            {category ? 'Edit Category' : 'Add Category'}
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
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Display Order</label>
            <input
              name="display_order"
              type="number"
              value={formData.display_order}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            {category && (
              <ImageUploader
                endpoint={`/api/admin/categories/${category.id}/image`}
                value={category.image}
                field="image"
                label="Category image"
                hint="Upload from this device. JPG, PNG or WebP up to 5 MB."
                onChange={(url) => setFormData((prev) => ({ ...prev, image: url ?? '' }))}
              />
            )}
            <div className={category ? "mt-6" : undefined}>
              <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">
                {category ? "Or paste an image link" : "Category image (link)"}
              </label>
              <input
                name="image"
                type="url"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://..."
                className={inputClass}
              />
              {!category && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Pasted links apply immediately on save. To upload a file instead, create the category first, then upload from the edit screen.
                </p>
              )}
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
              {loading ? 'Saving…' : category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}