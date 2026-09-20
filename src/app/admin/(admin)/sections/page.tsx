import { createServiceClient } from '@/lib/supabase';

export default async function SectionsPage() {
  const { data, error } = await createServiceClient().from('catalogue_sections').select('*').order('display_order', { ascending: true });
  return (
    <div>
      <div className="mb-8"><h1 className="font-serif text-[32px] leading-none text-[var(--ink)]">Custom sections</h1><p className="mt-2 text-sm text-[var(--muted)]">Add quiet editorial sections between product categories.</p></div>
      {error ? <div className="border border-[var(--line)] bg-[var(--paper)] p-5 text-sm text-[var(--muted)]">Run the catalogue sections migration to enable this area.</div> : <div className="border border-[var(--line)] bg-[var(--paper)] p-5"><p className="text-sm text-[var(--muted)]">Section editor is ready for {data?.length ?? 0} sections. Use the migration to enable persistence.</p></div>}
    </div>
  );
}
