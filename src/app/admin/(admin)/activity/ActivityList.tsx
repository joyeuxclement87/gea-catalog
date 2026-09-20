'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  IconArrowsSort,
  IconClock,
  IconFileText,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconSettings,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import {
  ACTION_GROUPS,
  ENTITY_FILTERS,
  actionLabel,
  entityTypeLabel,
} from '@/lib/activity-meta';
import type { AuditLogRow } from '@/lib/audit';

interface ActivityListProps {
  logs: AuditLogRow[];
  users: { user_id: string | null; user_name: string | null; user_email: string | null }[];
  categoryNames: Record<string, string>;
  total: number;
  page: number;
  totalPages: number;
  search: string;
  user: string;
  action: string;
  entity: string;
  status: string;
  from: string;
  to: string;
  sort: string;
  ready: boolean;
}

const inputClass =
  'w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

const CHANGE_LABELS: Record<string, string> = {
  name: 'Name',
  slug: 'Slug',
  category_id: 'Category',
  description: 'Description',
  price: 'Price',
  sku: 'SKU',
  status: 'Status',
  image: 'Image',
  image_url: 'Image',
  cover_image_url: 'Cover image',
  display_order: 'Display order',
  title: 'Title',
  website_url: 'Website URL',
  contact_phone: 'Phone',
  contact_email: 'Email',
  contact_address: 'Address',
  closing_message: 'Closing message',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFullDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ActionGlyph({ action, className }: { action: string; className?: string }) {
  let Icon = IconClock;
  if (action.endsWith('.created')) Icon = IconPlus;
  else if (action.includes('.deleted') || action.includes('_removed')) Icon = IconTrash;
  else if (action.startsWith('media.')) Icon = action === 'media.uploaded' ? IconUpload : action === 'media.deleted' ? IconTrash : IconPhoto;
  else if (action.includes('image_') || action.includes('cover')) Icon = IconPhoto;
  else if (action.startsWith('pdf.')) Icon = IconFileText;
  else if (action.includes('reordered')) Icon = IconArrowsSort;
  else if (action.startsWith('settings.')) Icon = IconSettings;
  else if (action.includes('.updated') || action.includes('_updated') || action.includes('.published') || action.includes('.unpublished') || action === 'product.category_changed') Icon = IconPencil;

  return (
    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--brand-blue-light)] text-[var(--brand-blue-dark)] ${className ?? ''}`}>
      <Icon size={15} stroke={1.8} aria-hidden />
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'success';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium ${
        isSuccess
          ? 'bg-[var(--brand-blue-light)] text-[var(--brand-blue-dark)]'
          : 'bg-[#fbeae9] text-[#a33b2f]'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isSuccess ? 'bg-[var(--brand-blue)]' : 'bg-[#a33b2f]'}`}
        aria-hidden
      />
      {isSuccess ? 'Success' : 'Failed'}
    </span>
  );
}

export default function ActivityList(props: ActivityListProps) {
  const { logs, users, categoryNames, total, page, totalPages, ready } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<AuditLogRow | null>(null);

  function buildQuery(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    return next.toString();
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    router.push(`/admin/activity?${buildQuery({ search: formData.get('search') as string, page: '1' })}`);
  }

  function handleFilterChange(key: string, value: string) {
    router.push(`/admin/activity?${buildQuery({ [key]: value || undefined, page: '1' })}`);
  }

  function handlePageChange(newPage: number) {
    router.push(`/admin/activity?${buildQuery({ page: String(newPage) })}`);
  }

  function handleClearFilters() {
    router.push('/admin/activity');
  }

  const filtersActive = Boolean(props.search || props.user || props.action || props.entity || props.status || props.from || props.to);

  const changes = selected?.metadata?.changes as
    | Record<string, { from: unknown; to: unknown }>
    | undefined;

  const extraMeta = selected?.metadata
    ? Object.fromEntries(Object.entries(selected.metadata).filter(([key]) => key !== 'changes'))
    : {};

  function describeChange(key: string, value: unknown): string {
    if (key === 'category_id' && typeof value === 'string' && categoryNames[value]) {
      return categoryNames[value];
    }
    return formatValue(value);
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] leading-none tracking-[-0.01em] text-[var(--ink)]">
            Activity History
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">A complete, immutable record of admin actions.</p>
        </div>
        <p className="hidden shrink-0 text-sm text-[var(--muted)] sm:block">{total} {total === 1 ? 'activity' : 'activities'}</p>
      </div>

      {!ready ? (
        <div className="max-w-3xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-[var(--ink-2)]">
            Activity history is not active yet. Run{' '}
            <code className="font-mono text-[var(--brand-blue)]">supabase/migrations/20260920_activity_logs.sql</code> in the
            Supabase SQL editor to enable the audit log. All admin actions are logged automatically once active.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSearch} className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <input
                name="search"
                type="search"
                placeholder="Search product, category, user, email, action…"
                defaultValue={props.search}
                className={inputClass}
              />
            </div>
            <select
              value={props.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className={`${inputClass}`}
              aria-label="Filter by user"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.user_id ?? 'system'} value={u.user_id ?? ''}>
                  {u.user_name ?? u.user_email ?? 'Visitor'}
                </option>
              ))}
            </select>
            <select
              value={props.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className={inputClass}
              aria-label="Filter by action"
            >
              <option value="">All actions</option>
              {ACTION_GROUPS.map((group) => (
                <optgroup key={group.entity} label={group.label}>
                  {group.actions.map((a) => (
                    <option key={a} value={a}>{actionLabel(a)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select
              value={props.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              className={inputClass}
              aria-label="Filter by entity type"
            >
              {ENTITY_FILTERS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <select
              value={props.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={inputClass}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={props.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className={inputClass}
              aria-label="Sort activities"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <div className="flex items-center gap-3 lg:col-span-2">
              <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                From
                <input
                  type="date"
                  value={props.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                  className={`${inputClass} w-auto`}
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                To
                <input
                  type="date"
                  value={props.to}
                  onChange={(e) => handleFilterChange('to', e.target.value)}
                  className={`${inputClass} w-auto`}
                />
              </label>
              {filtersActive ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="ml-auto text-sm font-medium text-[var(--accent)] underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:text-[var(--ink)]"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </form>

          {/* Desktop table */}
          <div className="hidden overflow-hidden border border-[var(--line)] bg-[var(--paper)] lg:block">
            <table className="w-full">
              <thead className="border-b border-[var(--line-strong)] bg-[var(--paper-2)]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Activity</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">User</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Item</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Date &amp; Time</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-[var(--paper-2)]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <ActionGlyph action={log.action} />
                        <div>
                          <p className="font-medium leading-snug text-[var(--ink)]">{actionLabel(log.action)}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-2)]">{log.action}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-[var(--ink)]">{log.user_name ?? '—'}</p>
                      {log.user_email ? <p className="mt-0.5 text-xs text-[var(--muted)]">{log.user_email}</p> : null}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-[var(--ink-2)]">{log.entity_name ?? '—'}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-[var(--muted-2)]">{entityTypeLabel(log.entity_type)}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--ink-2)]">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-4"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-4">
                      <p className="max-w-[280px] truncate text-sm text-[var(--muted)]">{log.description ?? '—'}</p>
                      <button
                        onClick={() => setSelected(log)}
                        className="mt-1 text-sm font-medium text-[var(--accent)] underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:text-[var(--ink)]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="p-12 text-center text-[var(--muted)]">
                {filtersActive ? 'No activity matches your filters.' : 'No admin activity recorded yet.'}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3">
                <p className="text-sm text-[var(--muted)]">
                  Page {page} of {totalPages} — {total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="border border-[var(--line-strong)] px-3 py-1 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="border border-[var(--line-strong)] px-3 py-1 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile / tablet cards */}
          <div className="space-y-3 lg:hidden">
            {logs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelected(log)}
                className="block w-full border border-[var(--line)] bg-[var(--paper)] p-4 text-left transition-colors hover:bg-[var(--paper-2)]"
              >
                <div className="flex items-start gap-3">
                  <ActionGlyph action={log.action} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug text-[var(--ink)]">{actionLabel(log.action)}</p>
                      <StatusBadge status={log.status} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink-2)]">{log.entity_name ?? '—'}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {log.user_name ?? '—'}
                      {log.user_email ? ` · ${log.user_email}` : ''}
                      {' · '}{formatDateTime(log.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {logs.length === 0 && (
              <div className="border border-[var(--line)] bg-[var(--paper)] p-10 text-center text-sm text-[var(--muted)]">
                {filtersActive ? 'No activity matches your filters.' : 'No admin activity recorded yet.'}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border border-[var(--line)] bg-[var(--paper)] px-4 py-3">
                <p className="text-sm text-[var(--muted)]">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="border border-[var(--line-strong)] px-3 py-1 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="border border-[var(--line-strong)] px-3 py-1 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-[var(--muted-2)]">
            Audit records are written server-side from the authenticated session and are immutable — they cannot be edited or
            deleted from this panel.
          </p>
        </>
      )}

      {/* Detail modal */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-xl border border-[var(--line-strong)] bg-[var(--paper)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] p-6">
              <div className="flex items-center gap-3">
                <ActionGlyph action={selected.action} />
                <div>
                  <h2 className="font-serif text-[22px] leading-tight text-[var(--ink)]">{actionLabel(selected.action)}</h2>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-2)]">{selected.action}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-2xl leading-none text-[var(--muted)] transition-colors hover:text-[var(--ink)]" aria-label="Close">
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="label text-[var(--muted)]">User</p>
                  <p className="mt-1.5 text-sm font-medium text-[var(--ink)]">{selected.user_name ?? '—'}</p>
                  {selected.user_email ? (
                    <p className="mt-0.5 text-sm text-[var(--accent)]">{selected.user_email}</p>
                  ) : null}
                </div>
                <div>
                  <p className="label text-[var(--muted)]">Date &amp; time</p>
                  <p className="mt-1.5 text-sm text-[var(--ink-2)]">{formatFullDate(selected.created_at)}</p>
                </div>
                <div>
                  <p className="label text-[var(--muted)]">Entity</p>
                  <p className="mt-1.5 text-sm font-medium text-[var(--ink)]">{selected.entity_name ?? '—'}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-[var(--muted-2)]">
                    {entityTypeLabel(selected.entity_type)}
                    {selected.entity_id ? ` · ${selected.entity_id}` : ''}
                  </p>
                </div>
                <div>
                  <p className="label text-[var(--muted)]">Status</p>
                  <div className="mt-1.5"><StatusBadge status={selected.status} /></div>
                </div>
              </div>

              <div className="border-t border-[var(--line)] pt-5">
                <p className="label text-[var(--muted)]">Description</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-2)]">{selected.description ?? '—'}</p>
              </div>

              {changes && Object.keys(changes).length > 0 ? (
                <div className="border-t border-[var(--line)] pt-5">
                  <p className="label text-[var(--muted)]">Changes made</p>
                  <div className="mt-3 divide-y divide-[var(--line)] border border-[var(--line)]">
                    {Object.entries(changes).map(([key, change]) => (
                      <div key={key} className="px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
                          {CHANGE_LABELS[key] ?? key}
                        </p>
                        <p className="mt-1 text-sm text-[var(--ink-2)]">
                          <span className="text-[var(--muted)]">{describeChange(key, change.from)}</span>
                          <span className="mx-2 text-[var(--muted-2)]">→</span>
                          <span className="font-medium text-[var(--ink)]">{describeChange(key, change.to)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {Object.keys(extraMeta).length > 0 ? (
                <div className="border-t border-[var(--line)] pt-5">
                  <p className="label text-[var(--muted)]">Additional details</p>
                  <dl className="mt-3 space-y-2">
                    {Object.entries(extraMeta).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-6">
                        <dt className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
                          {(CHANGE_LABELS[key] ?? key).replace(/_/g, ' ')}
                        </dt>
                        <dd className="break-all text-right font-mono text-xs text-[var(--ink-2)]">{formatValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              <div className="flex justify-end border-t border-[var(--line)] pt-5">
                <button
                  onClick={() => setSelected(null)}
                  className="border border-[var(--line-strong)] px-4 py-2 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-2)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}