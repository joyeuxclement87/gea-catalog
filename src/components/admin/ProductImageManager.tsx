'use client';

import { useRef, useState } from 'react';
import { parseJsonResponse } from '@/lib/client-json';

export type ManagedProductImage = {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
};

type Props = {
  productId: string;
  initialImages?: ManagedProductImage[];
};

const accepted = 'image/jpeg,image/png,image/webp';

export default function ProductImageManager({ productId, initialImages = [] }: Props) {
  const [images, setImages] = useState(() => [...initialImages].sort((a, b) => a.display_order - b.display_order));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const addInput = useRef<HTMLInputElement>(null);

  function showError(value: string) {
    setError(value);
    setMessage('');
  }

  async function refresh() {
    const response = await fetch(`/api/admin/products/${productId}/images`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to refresh images.');
    setImages((await parseJsonResponse<ManagedProductImage[]>(response)) ?? []);
  }

  async function addImage(file: File) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`/api/admin/products/${productId}/images`, { method: 'POST', body: form });
      const result = await parseJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result?.error || `Upload failed (HTTP ${response.status}).`);
      await refresh();
      setMessage('Image added.');
    } catch (uploadError) {
      showError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function replaceImage(imageId: string, file: File) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, { method: 'PUT', body: form });
      const result = await parseJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result?.error || `Replace failed (HTTP ${response.status}).`);
      await refresh();
      setMessage('Image replaced.');
    } catch (replaceError) {
      showError(replaceError instanceof Error ? replaceError.message : 'Replace failed.');
    } finally {
      setBusy(false);
    }
  }

  async function imageAction(imageId: string, action: 'primary' | 'order', displayOrder?: number) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, display_order: displayOrder }),
      });
      const result = await parseJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result?.error || `Image update failed (HTTP ${response.status}).`);
      await refresh();
      setMessage(action === 'primary' ? 'Primary image updated.' : 'Image order updated.');
    } catch (actionError) {
      showError(actionError instanceof Error ? actionError.message : 'Image update failed.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteImage(image: ManagedProductImage) {
    if (!window.confirm(images.length === 1 ? 'Delete the only image? The product will have no image.' : 'Delete this image?')) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/admin/products/${productId}/images/${image.id}`, { method: 'DELETE' });
      const result = await parseJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result?.error || `Delete failed (HTTP ${response.status}).`);
      await refresh();
      setMessage('Image deleted.');
    } catch (deleteError) {
      showError(deleteError instanceof Error ? deleteError.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  }

  async function move(image: ManagedProductImage, direction: -1 | 1) {
    const index = images.findIndex((item) => item.id === image.id);
    const target = images[index + direction];
    if (!target) return;
    setBusy(true);
    setError('');
    try {
      await Promise.all([
        imageActionWithoutBusy(image.id, target.display_order),
        imageActionWithoutBusy(target.id, image.display_order),
      ]);
      await refresh();
    } catch {
      showError('Unable to reorder images.');
    } finally {
      setBusy(false);
    }
  }

  async function imageActionWithoutBusy(imageId: string, displayOrder: number) {
    const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'order', display_order: displayOrder }),
    });
    if (!response.ok) throw new Error('Order update failed.');
  }

  return (
    <section className="border-t border-[var(--line)] pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-[22px] text-[var(--ink)]">Product images</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{images.length} / 5 images. The primary image appears across the catalogue.</p>
        </div>
        <button
          type="button"
          onClick={() => addInput.current?.click()}
          disabled={busy || images.length >= 5}
          className="shrink-0 border border-[var(--line-strong)] px-3 py-2 text-sm font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {images.length >= 5 ? 'Maximum 5 images' : '+ Add image'}
        </button>
        <input
          ref={addInput}
          className="hidden"
          type="file"
          accept={accepted}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = '';
            if (file) void addImage(file);
          }}
        />
      </div>

      {error ? <p className="mt-4 border border-[#c9b0a6] bg-[#f6ece6] px-3 py-2 text-sm text-[#8a2f1b]">{error}</p> : null}
      {message ? <p className="mt-4 border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2 text-sm text-[var(--accent)]">{message}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((image, index) => (
          <ImageTile
            key={image.id}
            image={image}
            index={index}
            total={images.length}
            busy={busy}
            onReplace={(file) => void replaceImage(image.id, file)}
            onDelete={() => void deleteImage(image)}
            onPrimary={() => void imageAction(image.id, 'primary')}
            onMove={(direction) => void move(image, direction)}
          />
        ))}
        {images.length === 0 ? <p className="col-span-full border border-dashed border-[var(--line-strong)] p-8 text-center text-sm text-[var(--muted)]">No images yet. Add the first product image.</p> : null}
      </div>
    </section>
  );
}

function ImageTile({
  image,
  index,
  total,
  busy,
  onReplace,
  onDelete,
  onPrimary,
  onMove,
}: {
  image: ManagedProductImage;
  index: number;
  total: number;
  busy: boolean;
  onReplace: (file: File) => void;
  onDelete: () => void;
  onPrimary: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="border border-[var(--line)] bg-[var(--paper-2)] p-2">
      <div className="relative aspect-square overflow-hidden bg-white">
        <img src={image.image_url} alt={`Product image ${index + 1}`} className="h-full w-full object-contain p-2" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="label text-[9px] text-[var(--muted)]">Image {index + 1}</span>
        {image.is_primary ? <span className="label text-[9px] text-[var(--accent)]">Primary</span> : null}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="border border-[var(--line-strong)] px-1 py-1.5 text-[11px] text-[var(--ink-2)] disabled:opacity-50">Replace</button>
        <button type="button" onClick={onDelete} disabled={busy} className="border border-[#c9b0a6] px-1 py-1.5 text-[11px] text-[#8a2f1b] disabled:opacity-50">Delete</button>
        <button type="button" onClick={() => onMove(-1)} disabled={busy || index === 0} className="border border-[var(--line-strong)] px-1 py-1.5 text-[11px] text-[var(--ink-2)] disabled:opacity-40">Move left</button>
        <button type="button" onClick={() => onMove(1)} disabled={busy || index === total - 1} className="border border-[var(--line-strong)] px-1 py-1.5 text-[11px] text-[var(--ink-2)] disabled:opacity-40">Move right</button>
      </div>
      {!image.is_primary ? <button type="button" onClick={onPrimary} disabled={busy} className="mt-1.5 w-full px-1 py-1.5 text-[11px] text-[var(--accent)] underline underline-offset-2 disabled:opacity-50">Set as primary</button> : null}
      <input ref={input} className="hidden" type="file" accept={accepted} onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ''; if (file) onReplace(file); }} />
    </div>
  );
}
