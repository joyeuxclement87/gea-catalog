'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-7">
      {navigation.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`label transition-colors ${
              active
                ? 'text-[var(--ink)] underline decoration-[var(--accent)] decoration-2 underline-offset-8'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}