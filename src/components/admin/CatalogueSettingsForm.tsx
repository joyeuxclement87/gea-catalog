'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import ImageUploader from './ImageUploader';

const inputClass =
  'w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]';

export default function CatalogueSettingsForm({
  initial,
  defaults,
}: {
  initial: Record<string, string | null> | null;
  defaults: Record<string, string>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [website, setWebsite] = useState(initial?.website_url || defaults.website_url);
  const [phone, setPhone] = useState(initial?.contact_phone || defaults.contact_phone);
  const [email, setEmail] = useState(initial?.contact_email || defaults.contact_email);
  const [address, setAddress] = useState(initial?.contact_address || defaults.contact_address);
  const [messageText, setMessageText] = useState(initial?.closing_message || defaults.closing_message);

  const coverUrl = initial?.cover_image_url || null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: website,
          contact_phone: phone,
          contact_email: email,
          contact_address: address,
          closing_message: messageText,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save settings.');
      setMessage('Settings saved. The catalogue updates on its next render.');
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">Catalogue settings</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Publication details used on the cover and the closing page.</p>
      </div>

      <form onSubmit={save} className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-5 border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
          {error ? <div className="border border-[#c9b0a6] bg-[#f6ece6] p-3 text-sm text-[#8a2f1b]">{error}</div> : null}
          {message ? <div className="border border-[var(--brand-blue-light)] bg-[var(--brand-blue-light)] p-3 text-sm text-[var(--brand-blue-dark)]">{message}</div> : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Website URL</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://www.globalengineeringagency.com" />
            <p className="mt-1 text-xs text-[var(--muted)]">Used by the closing-page QR code and the Visit Website button.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink-2)]">Closing message</label>
            <textarea rows={3} value={messageText} onChange={(e) => setMessageText(e.target.value)} className={inputClass} />
          </div>

          <ImageUploader
            endpoint="/api/admin/settings/cover"
            value={coverUrl}
            field="cover_image_url"
            label="Cover image"
            hint="Shown on the opening page of the catalogue. Replaces the default cover in /public/images/cover/."
          />
        </div>

        <aside className="w-full max-w-xs space-y-5 self-start">
          <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
            <p className="label text-[var(--muted)]">QR code preview</p>
            <div className="mt-3 w-fit border border-[var(--line)] bg-white p-3">
              <QRCodeSVG value={website || defaults.website_url} size={140} bgColor="#ffffff" fgColor="#0d3970" includeMargin />
            </div>
            <p className="mt-3 break-all text-xs text-[var(--muted)]">{website || defaults.website_url}</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-semibold text-[var(--paper)] transition-colors hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </aside>
      </form>
    </div>
  );
}