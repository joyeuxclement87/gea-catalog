'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/admin/ImageUploader';

const inputClass =
  'w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]';

type Section = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_path: string | null;
  display_order: number;
  status: string;
};

export default function SectionManager({ sections: initial }: { sections: Section[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [editing, setEditing] = useState<Section | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Section | null>(null);
  const [busy, setBusy] = useState(false);

  async function reorder(fromIndex: number, toIndex: number) {
    const next = [...sections];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const updates = next.map((s, i) => ({ id: s.id, display_order: i }));
    setSections(next);
    await Promise.all(
      updates.map((u) =>
        fetch(`/api/admin/sections/${u.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: u.display_order }),
        }),
      ),
    );
    router.refresh();
  }

  function move(direction: -1 | 1, index: number) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    void reorder(index, target);
  }

  async function deleteSection() {
    if (!deleting) return;
    setBusy(true);
    const response = await fetch(`/api/admin/sections/${deleting.id}`, { method: 'DELETE' });
    if (response.ok) {
      setSections(sections.filter((s) => s.id !== deleting.id));
      setDeleting(null);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">Sections</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Editorial dividers between product categories. A section does not need to contain products.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--paper)] transition-colors hover:bg-[var(--brand-blue-dark)]"
        >
          Add Section
        </button>
      </div>

      {creating && (
        <SectionForm
          onClose={() => setCreating(false)}
          onCreated={(section) => {
            setCreating(false);
            setEditing(section);
          }}
        />
      )}

      {editing && (
        <SectionForm
          section={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <div className="divide-y divide-[var(--line)] border border-[var(--line)] bg-[var(--paper)]">
        {sections.map((section, index) => (
          <div key={section.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-[var(--paper-2)]">
            <div className="flex items-center gap-2">
              <button onClick={() => move(-1, index)} disabled={index === 0} aria-label="Move up" className="p-1 text-lg leading-none text-[var(--muted)] transition-colors hover:text-[var(--brand-blue)] disabled:opacity-40">
                ↑
              </button>
              <span className="w-6 text-center text-sm font-medium text-[var(--ink)]">{index + 1}</span>
              <button onClick={() => move(1, index)} disabled={index === sections.length - 1} aria-label="Move down" className="p-1 text-lg leading-none text-[var(--muted)] transition-colors hover:text-[var(--brand-blue)] disabled:opacity-40">
                ↓
              </button>
            </div>

            <div className="relative h-14 w-20 shrink-0 overflow-hidden border border-[var(--line)] bg-[var(--paper-2)]">
              {section.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={section.image_url} alt={section.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="label text-[8px] text-[var(--muted-2)]">No image</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--ink)]">{section.title}</p>
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                {section.description || 'No description'} — /{section.slug}
              </p>
            </div>

            <StatusBadge status={section.status} />

            <div className="flex items-center gap-4">
              <button onClick={() => setEditing(section)} className="text-sm font-medium text-[var(--brand-blue)] underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:text-[var(--brand-blue-dark)]">
                Edit
              </button>
              <button onClick={() => setDeleting(section)} className="text-sm font-medium text-[#8a2f1b] underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:text-[#6e2514]">
                Delete
              </button>
            </div>
          </div>
        ))}

        {sections.length === 0 ? (
          <p className="p-12 text-center text-sm text-[var(--muted)]">No custom sections yet. Add the first editorial section.</p>
        ) : null}
      </div>

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md border border-[var(--line-strong)] bg-[var(--paper)] p-6">
            <h3 className="font-serif text-[22px] text-[var(--ink)]">Delete section?</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">“{deleting.title}” will be removed from the catalogue. Cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleting(null)} className="border border-[var(--line-strong)] px-4 py-2 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)]">
                Cancel
              </button>
              <button onClick={() => void deleteSection()} disabled={busy} className="bg-[#8a2f1b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6e2514] disabled:opacity-50">
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium ${
        status === 'published'
          ? 'bg-[var(--brand-blue-light)] text-[var(--brand-blue-dark)]'
          : 'border border-[var(--line-strong)] bg-[var(--paper-2)] text-[var(--muted)]'
      }`}
    >
      {status}
    </span>
  );
}

function SectionForm({
  section,
  onClose,
  onSaved,
  onCreated,
}: {
  section?: Section;
  onClose: () => void;
  onSaved?: (section: Section) => void;
  onCreated?: (section: Section) => void;
}) {
  const [formData, setFormData] = useState({
    title: section?.title ?? '',
    description: section?.description ?? '',
    display_order: section?.display_order ?? 0,
    status: section?.status ?? 'published',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...formData,
      display_order: Number(formData.display_order) || 0,
    };
    const url = section ? `/api/admin/sections/${section.id}` : '/api/admin/sections';
    const method = section ? 'PATCH' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'Failed to save section.');
      setSaving(false);
      return;
    }
    if (section) onSaved?.(result as Section);
    else onCreated?.(result as Section);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-2xl border border-[var(--line-strong)] bg-[var(--paper)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] p-6">
          <h2 className="font-serif text-[24px] text-[var(--ink)]">{section ? 'Edit section' : 'New section'}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-[var(--muted)] transition-colors hover:text-[var(--ink)]">×</button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          {error && <div className="border border-[#c9b0a6] bg-[#f6ece6] p-3 text-sm text-[#8a2f1b]">{error}</div>}

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Section title *</label>
            <input name="title" type="text" value={formData.title} onChange={handleChange} required className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Short description</label>
            <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Display order</label>
              <input name="display_order" type="number" value={formData.display_order} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {section ? (
            <ImageUploader
              endpoint={`/api/admin/sections/${section.id}/image`}
              value={section.image_url}
              field="image_url"
              label="Section image"
              hint="Wide editorial image shown with the section heading."
            />
          ) : (
            <p className="border border-dashed border-[var(--line-strong)] bg-[var(--paper-2)] p-3 text-xs text-[var(--muted)]">
              Save the section first, then upload its image.
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-5">
            <button type="button" onClick={onClose} className="border border-[var(--line-strong)] px-4 py-2 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)]">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--paper)] transition-colors hover:bg-[var(--brand-blue-dark)] disabled:opacity-50">
              {saving ? 'Saving…' : section ? 'Save changes' : 'Create section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}