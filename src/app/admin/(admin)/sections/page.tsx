import { createServiceClient } from '@/lib/supabase';
import SectionManager from './SectionManager';

export default async function SectionsPage() {
  const { data, error } = await createServiceClient()
    .from('catalogue_sections')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">Sections</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Editorial dividers between product categories.</p>
        </div>
        <div className="max-w-3xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-[var(--ink-2)]">
            Sections are not active yet. Run <code className="font-mono text-[var(--brand-blue)]">supabase/migrations/20260920_catalogue_sections.sql</code> in the
            Supabase SQL editor to enable custom editorial sections.
          </p>
        </div>
      </div>
    );
  }

  return <SectionManager sections={data ?? []} />;
}