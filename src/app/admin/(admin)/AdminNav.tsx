'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconAdjustments, IconCategory, IconDashboard, IconPhoto, IconShoppingBag } from '@tabler/icons-react';

const navigation = [
  { href: '/admin', label: 'Dashboard', icon: IconDashboard },
  { href: '/admin/products', label: 'Products', icon: IconShoppingBag },
  { href: '/admin/categories', label: 'Categories', icon: IconCategory },
  { href: '/admin/media', label: 'Media', icon: IconPhoto },
  { href: '/admin/settings', label: 'Catalogue settings', icon: IconAdjustments },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden space-y-1 md:block">
      {navigation.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
              active
                ? 'bg-[var(--paper-2)] font-medium text-[var(--ink)]'
                : 'text-[var(--muted)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]'
            }`}
          >
            <Icon size={17} stroke={1.7} aria-hidden />
            {item.label}
          </Link>
        );
      })}
      </nav>
      <nav className="flex gap-1 overflow-x-auto border-t border-[var(--line)] px-4 py-2 md:hidden" aria-label="Admin sections">
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={`shrink-0 px-3 py-2 text-xs ${active ? 'bg-[var(--paper-2)] font-medium text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
