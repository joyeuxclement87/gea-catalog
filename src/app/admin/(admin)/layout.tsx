import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getDashboardStats } from '@/lib/admin-actions';
import AdminNav from './AdminNav';

export const metadata: Metadata = {
  title: 'GEA Catalogue Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect('/admin/login');

  const stats = await getDashboardStats();

  return (
    <main className="min-h-screen bg-[var(--desk)] font-sans antialiased">
      <header className="sticky top-0 z-10 border-b border-[var(--line-strong)] bg-[var(--paper)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="/admin" aria-label="GEA — Dashboard">
                <img
                  src="/GEA - logo.png"
                  alt="GEA"
                  className="h-9 w-auto"
                  width={3480}
                  height={1588}
                />
              </Link>
              <AdminNav />
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-[var(--muted)] sm:inline">{user.email}</span>
              <form action="/api/admin/logout" method="POST">
                <button
                  type="submit"
                  className="label border border-[var(--line-strong)] px-3 py-2 text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
        <div className="mb-8">
          <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Overview of your catalogue</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Products" value={stats.totalProducts} tone="ink" />
          <StatCard label="Published" value={stats.publishedProducts} tone="accent" />
          <StatCard label="Draft" value={stats.draftProducts} tone="muted" />
          <StatCard label="Categories" value={stats.totalCategories} tone="focus" />
        </div>

        {children}
      </main>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'ink' | 'accent' | 'muted' | 'focus';
}) {
  const tones: Record<string, string> = {
    ink: 'bg-[var(--ink)]',
    accent: 'bg-[var(--accent)]',
    muted: 'bg-[var(--muted)]',
    focus: 'bg-[var(--focus)]',
  };
  return (
    <div className="border border-[var(--line)] border-l-4 bg-[var(--paper)] p-5">
      <p className="label text-[var(--muted)]">{label}</p>
      <p className={`mt-2 h-1 w-8 ${tones[tone]}`} aria-hidden />
      <p className="mt-3 font-serif text-[34px] leading-none text-[var(--ink)]">{value}</p>
    </div>
  );
}