import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
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

  return (
    <main className="min-h-screen bg-[var(--desk)] font-sans antialiased md:flex">
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-[var(--line-strong)] bg-[var(--paper)] px-4 py-6 md:flex">
        <Link href="/admin" aria-label="GEA — Dashboard" className="px-3">
          <img src="/GEA - logo.png" alt="GEA" className="h-9 w-auto" width={3480} height={1588} />
        </Link>
        <p className="label mt-10 px-3 text-[var(--muted)]">Catalogue CMS</p>
        <div className="mt-3"><AdminNav /></div>
        <div className="mt-auto border-t border-[var(--line)] pt-5">
          <p className="truncate px-3 text-xs text-[var(--muted)]">{user.email}</p>
          <form action="/api/admin/logout" method="POST" className="mt-3">
            <button type="submit" className="w-full px-3 py-2 text-left text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)]">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-[var(--line-strong)] bg-[var(--paper)] md:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/admin" aria-label="GEA — Dashboard">
              <img src="/GEA - logo.png" alt="GEA" className="h-8 w-auto" width={3480} height={1588} />
            </Link>
            <form action="/api/admin/logout" method="POST"><button type="submit" className="text-sm text-[var(--muted)]">Sign out</button></form>
          </div>
          <AdminNav />
        </header>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
          {children}
        </section>
      </div>
    </main>
  );
}
