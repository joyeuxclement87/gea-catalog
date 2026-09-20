'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { parseJsonResponse } from '@/lib/client-json';

type PdfStatus = {
  status: 'current' | 'generating' | 'failed' | 'outdated';
  available: boolean;
  generating: boolean;
  generatedAt: string | null;
  fileSize: number | null;
  contentVersion: number;
  errorMessage: string | null;
  pendingSince: string | null;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  current: { label: 'Current', className: 'bg-[var(--brand-blue-light)] text-[var(--brand-blue-dark)]' },
  generating: { label: 'Generating', className: 'bg-[#f3f1e8] text-[#8a7d3c]' },
  failed: { label: 'Failed', className: 'bg-[#fbeae9] text-[#a33b2f]' },
  outdated: { label: 'Outdated', className: 'bg-[var(--brand-blue-light)] text-[var(--brand-blue-dark)]' },
};

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PdfManager({ initial }: { initial: PdfStatus }) {
  const [status, setStatus] = useState<PdfStatus>(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/catalogue/pdf/status');
      if (response.ok) {
        const data = await parseJsonResponse<PdfStatus>(response);
        if (data) setStatus(data);
      }
    } catch {
      // ignore transient failures; the next poll will retry
    }
  }, []);

  useEffect(() => {
    if (status.status === 'generating') {
      if (!pollTimer.current) {
        pollTimer.current = setInterval(refresh, 4000);
      }
    } else if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [status.status, refresh]);

  async function generate() {
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/admin/pdf/generate', { method: 'POST' });
      const result = await parseJsonResponse<{ status?: string; error?: string }>(response);
      if (response.status === 409) {
        setNotice('A PDF generation is already running — it will complete shortly.');
        await refresh();
        return;
      }
      if (!response.ok) {
        throw new Error(result?.error || `PDF generation failed (HTTP ${response.status}).`);
      }
      if (result?.status === 'busy') {
        setNotice('A PDF generation is already running — it will complete shortly.');
      } else if (result?.status === 'failed') {
        setNotice(`Generation failed: ${result.error ?? 'unknown error'}`);
      } else if (result?.status === 'stale') {
        setNotice('Catalogue changed while the PDF was rendering — a fresh PDF is being prepared.');
      } else {
        setNotice('Catalogue PDF generated and published.');
      }
      await refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'PDF generation failed.');
    } finally {
      setBusy(false);
    }
  }

  const meta = STATUS_LABELS[status.status] ?? STATUS_LABELS.outdated;
  const everGenerated = Boolean(status.generatedAt && status.fileSize);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">Catalogue PDF</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          One catalogue, one current PDF. The system regenerates it in place whenever catalogue content changes.
        </p>
      </div>

      <div className="max-w-3xl">
        <div className="border border-[var(--line)] bg-[var(--paper)]">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-6">
            <div>
              <p className="label text-[var(--muted)]">PDF status</p>
              <div className="mt-2 flex items-center gap-2.5">
                <span className={`px-2.5 py-1 label ${meta.className}`}>{meta.label}</span>
                {status.generating ? (
                  <span className="text-sm text-[var(--muted)]">Generating latest catalogue PDF...</span>
                ) : null}
              </div>
              {status.errorMessage ? (
                <p className="mt-3 max-w-[62ch] rounded-[3px] border border-[#e8c9c5] bg-[#fdf3f2] p-3 text-[13px] leading-relaxed text-[#8c2f26]">
                  <span className="label block text-[#a33b2f]">Generation error</span>
                  {status.errorMessage}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 text-right text-xs text-[var(--muted-2)]">
              v{status.contentVersion}
            </span>
          </div>

          <dl className="grid grid-cols-1 divide-y divide-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4 sm:px-6">
              <dt className="label text-[var(--muted)]">Last generated</dt>
              <dd className="mt-1.5 text-sm text-[var(--ink)]">{formatDate(status.generatedAt)}</dd>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <dt className="label text-[var(--muted)]">File size</dt>
              <dd className="mt-1.5 text-sm text-[var(--ink)]">{formatBytes(status.fileSize)}</dd>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <dt className="label text-[var(--muted)]">PDF availability</dt>
              <dd className="mt-1.5 text-sm text-[var(--ink)]">
                {everGenerated ? (
                  <span className="text-[var(--brand-blue-dark)]">Ready for download</span>
                ) : (
                  <span className="text-[var(--muted)]">Preparing — not published yet</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={generate}
              disabled={busy || status.generating}
              className="px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-wait disabled:opacity-60 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-dark)]"
            >
              {busy || status.generating ? 'Generating...' : status.status === 'failed' ? 'Retry Generation' : 'Generate PDF'}
            </button>

            <a
              href="/api/catalogue/pdf"
              className={`px-4 py-2 text-sm transition-colors border ${
                everGenerated
                  ? 'border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[var(--brand-blue-light)] hover:text-[var(--brand-blue-dark)]'
                  : 'pointer-events-none border-[var(--line-strong)] text-[var(--muted-2)]'
              }`}
            >
              {everGenerated ? 'Download Current PDF' : 'PDF not available yet'}
            </a>
          </div>
        </div>

        <p className="mt-5 max-w-[64ch] text-[13px] leading-relaxed text-[var(--muted)]">
          The PDF is stored at a single fixed path (<code className="font-mono text-[var(--ink-2)]">catalogue/GEA-Product-Catalogue-2026.pdf</code>)
          in the <code className="font-mono text-[var(--ink-2)]">catalogue-pdfs</code> bucket. Every catalogue edit marks it as outdated and a single
          fresh PDF replaces the existing one — no versions, no duplicates. If generation ever fails, the previous working PDF stays live and a Retry
          button appears here.
        </p>

        {notice ? (
          <p className="mt-4 max-w-[64ch] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink-2)]">{notice}</p>
        ) : null}
      </div>
    </div>
  );
}