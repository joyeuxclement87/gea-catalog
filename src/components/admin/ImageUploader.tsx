'use client';

import { useRef, useState } from 'react';

type UrlField = 'image' | 'image_url' | 'cover_image_url';

type Props = {
  endpoint: string;
  value?: string | null;
  onChange?: (url: string | null) => void;
  label?: string;
  hint?: string;
  field?: UrlField;
  compact?: boolean;
};

const accepted = 'image/jpeg,image/png,image/webp';

/**
 * Reusable single-image uploader. Uploads immediately to the given admin
 * endpoint (multipart `file`), persists the URL server-side, then reports the
 * new URL back through `onChange`. DELETE removes the image.
 */
export default function ImageUploader({
  endpoint,
  value,
  onChange,
  label = 'Image',
  hint = 'JPG, PNG or WebP up to 5 MB.',
  field = 'image',
  compact = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(endpoint, { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      const url = result?.[field] ?? null;
      if (url) {
        onChange?.(url);
        setMessage('Image uploaded.');
      } else {
        throw new Error('Upload did not return an image URL.');
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Remove this image?')) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(endpoint, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Remove failed.');
      onChange?.(null);
      setMessage('Image removed.');
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Remove failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label ? <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">{label}</label> : null}

      <div className={compact ? 'flex items-center gap-3' : ''}>
        <div className={`relative overflow-hidden border border-[var(--line)] bg-[var(--paper-2)] ${compact ? 'h-20 w-20 shrink-0' : 'aspect-[16/9] w-full max-w-sm'}`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-contain p-1.5" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="label px-3 text-center text-[var(--muted-2)]">No image</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="border border-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue-light)] disabled:opacity-50"
          >
            {value ? 'Replace image' : 'Upload image'}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="border border-[var(--line-strong)] px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:border-[#c9b0a6] hover:text-[#8a2f1b] disabled:opacity-50"
            >
              Remove
            </button>
          ) : null}
          {busy ? (
            <span className="text-sm text-[var(--muted)]">Uploading…</span>
          ) : message ? (
            <span className="text-sm text-[var(--brand-blue)]">{message}</span>
          ) : null}
        </div>
      </div>

      <input
        ref={input}
        className="hidden"
        type="file"
        accept={accepted}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = '';
          if (file) void upload(file);
        }}
      />
      {error ? (
        <p className="mt-2 border border-[#c9b0a6] bg-[#f6ece6] px-3 py-2 text-sm text-[#8a2f1b]">{error}</p>
      ) : hint && !message ? (
        <p className="mt-2 text-xs text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}