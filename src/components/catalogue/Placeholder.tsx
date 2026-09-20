export function ProductPlaceholder() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[var(--paper-2)] px-5">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <span className="label uppercase tracking-[0.28em] text-[var(--muted)]">Image</span>
        <span className="h-px w-9 bg-[var(--brand-blue)] opacity-60" aria-hidden />
        <span className="label uppercase tracking-[0.2em] text-[var(--muted-2)]">Coming soon</span>
      </div>
    </div>
  );
}

export function CategoryPlaceholder({ name }: { name: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[var(--paper-2)]">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <span className="label text-[9px] text-[var(--muted)]">Section cover</span>
        <span className="h-px w-11 bg-[var(--brand-blue)]" aria-hidden />
        <span className="max-w-[24ch] font-serif text-[13px] italic leading-relaxed text-[var(--muted-2)]">{name}</span>
      </div>
    </div>
  );
}

export function CoverPlaceholder() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[var(--paper-2)]">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <span className="label text-[var(--muted)]">Cover</span>
        <span className="h-px w-10 bg-[var(--brand-blue)]" aria-hidden />
        <span className="font-serif text-[12px] italic text-[var(--muted-2)]">Set the cover image in admin settings</span>
      </div>
    </div>
  );
}