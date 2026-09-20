export default function CatalogueSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">Catalogue settings</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Keep publication details together as the catalogue grows.</p>
      </div>
      <div className="max-w-2xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-[var(--ink-2)]">
          Catalogue-wide settings are not stored in the current Supabase schema yet. Product, category, and image management are active; title, contact, cover, and final-page settings can be added here once the settings table is enabled.
        </p>
      </div>
    </div>
  );
}
