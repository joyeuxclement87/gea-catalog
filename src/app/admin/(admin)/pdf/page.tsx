import { createServiceClient } from '@/lib/supabase';
import { toPdfStatusSummary, type PdfStatusRow } from '@/lib/pdf-status';
import PdfManager from '@/components/admin/PdfManager';

export const dynamic = 'force-dynamic';

export default async function CataloguePdfPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('catalogue_pdf_status')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">Catalogue PDF</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Manage the single current catalogue PDF.</p>
        </div>
        <div className="max-w-3xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-[var(--ink-2)]">
            The PDF system is not active yet. Run{' '}
            <code className="font-mono text-[var(--brand-blue)]">supabase/migrations/20260920_catalogue_pdf.sql</code> in the Supabase SQL editor to
            enable automatic PDF generation.
          </p>
        </div>
      </div>
    );
  }

  const summary = toPdfStatusSummary((data ?? null) as PdfStatusRow | null);
  return <PdfManager initial={summary} />;
}