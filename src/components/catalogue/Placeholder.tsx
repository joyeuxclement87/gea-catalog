export function ProductPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--paper-2)] px-5">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <span className="label uppercase tracking-[0.22em] text-[var(--muted)]">Image coming soon</span>
        <span className="h-px w-10 bg-[var(--line-strong)]" />
        <span className="max-w-full truncate font-serif text-[12.5px] italic leading-none text-[var(--muted-2)]">{name}</span>
      </div>
    </div>
  );
}

export function CategoryPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--paper-2)]">
      <div className="flex flex-col items-center gap-3 text-center px-6">
        <span className="label text-[9px] text-[var(--muted)]">Section image</span>
        <span className="h-px w-12 bg-[var(--line-strong)]" />
        <span className="font-serif text-[13px] italic leading-relaxed text-[var(--muted-2)] max-w-[20ch]">{name}</span>
      </div>
    </div>
  );
}

export function CoverPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--paper-2)]">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <span className="label text-[var(--muted)]">Cover</span>
        <span className="h-px w-10 bg-[var(--line-strong)]" />
        <span className="font-serif text-[12px] italic text-[var(--muted-2)]">Drop cover image in /public/images/cover/</span>
      </div>
    </div>
  );
}