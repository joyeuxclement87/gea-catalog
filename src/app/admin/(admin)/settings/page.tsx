import { createServiceClient } from '@/lib/supabase';
import { CATALOGUE_DEFAULTS } from '@/lib/catalog-settings';
import CatalogueSettingsForm from '@/components/admin/CatalogueSettingsForm';

const defaults = {
  website_url: CATALOGUE_DEFAULTS.website_url,
  contact_phone: CATALOGUE_DEFAULTS.contact_phone,
  contact_email: CATALOGUE_DEFAULTS.contact_email,
  contact_address: CATALOGUE_DEFAULTS.contact_address,
  closing_message: CATALOGUE_DEFAULTS.closing_message,
};

export default async function CatalogueSettingsPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('catalogue_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">Catalogue settings</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Keep publication details together as the catalogue grows.</p>
        </div>
        <div className="max-w-3xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-[var(--ink-2)]">
            Settings are not active yet. Run <code className="font-mono text-[var(--brand-blue)]">supabase/migrations/20260920_catalogue_settings.sql</code> in the
            Supabase SQL editor to enable cover, contact, and final-page configuration.
          </p>
        </div>
      </div>
    );
  }

  return <CatalogueSettingsForm initial={data ?? null} defaults={defaults} />;
}