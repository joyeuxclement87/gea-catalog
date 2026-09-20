import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div>
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
    </div>
  );
}