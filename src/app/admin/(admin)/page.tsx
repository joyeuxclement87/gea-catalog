import Link from 'next/link';
import { getDashboardStats, getRecentProductsAdmin } from '@/lib/admin-actions';

export default async function AdminDashboardPage() {
  const [stats, recentProducts] = await Promise.all([getDashboardStats(), getRecentProductsAdmin()]);
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">A focused view of catalogue health and recent work.</p>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Products" value={stats.totalProducts} />
        <Summary label="Published" value={stats.publishedProducts} />
        <Summary label="Drafts" value={stats.draftProducts} />
        <Summary label="Categories" value={stats.totalCategories} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/admin/products?action=create"
          className="group border border-[var(--line)] bg-[var(--paper)] p-6 transition-colors hover:border-[var(--accent)] hover:bg-[var(--paper-2)]"
        >
          <h2 className="font-serif text-[22px] text-[var(--ink)]">Add New Product</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Create a new product entry</p>
          <p className="mt-5 label text-[var(--accent)] underline decoration-[var(--line-strong)] underline-offset-6 transition-colors group-hover:decoration-[var(--accent)]">
            Open products
          </p>
        </Link>

        <Link
          href="/admin/categories?action=create"
          className="group border border-[var(--line)] bg-[var(--paper)] p-6 transition-colors hover:border-[var(--accent)] hover:bg-[var(--paper-2)]"
        >
          <h2 className="font-serif text-[22px] text-[var(--ink)]">Add New Category</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Create a new category section</p>
          <p className="mt-5 label text-[var(--accent)] underline decoration-[var(--line-strong)] underline-offset-6 transition-colors group-hover:decoration-[var(--accent)]">
            Open categories
          </p>
        </Link>
      </div>

      <section className="mt-8 border border-[var(--line)] bg-[var(--paper)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <h2 className="font-serif text-[22px] text-[var(--ink)]">Recently updated</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">The latest catalogue changes.</p>
          </div>
          <Link href="/admin/products" className="text-sm font-medium text-[var(--accent)]">View all</Link>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {recentProducts.map((product: any) => (
            <Link key={product.id} href="/admin/products" className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--paper-2)]">
              <div className="h-10 w-10 shrink-0 overflow-hidden border border-[var(--line)] bg-[var(--paper-2)]">
                {product.image ? <img src={product.image} alt="" className="h-full w-full object-contain" /> : null}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ink)]">{product.name}</span>
              <span className="hidden text-xs text-[var(--muted)] sm:block">{product.category?.name ?? 'Uncategorised'}</span>
              <span className="text-xs text-[var(--muted)]">{new Date(product.updated_at).toLocaleDateString()}</span>
            </Link>
          ))}
          {recentProducts.length === 0 ? <p className="px-5 py-8 text-sm text-[var(--muted)]">No products yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5">
      <p className="label text-[var(--muted)]">{label}</p>
      <p className="mt-3 font-serif text-[34px] leading-none text-[var(--ink)]">{value}</p>
    </div>
  );
}
