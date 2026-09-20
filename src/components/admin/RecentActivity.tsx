import Link from 'next/link';
import {
  IconArrowRight,
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
import { actionLabel, entityTypeLabel } from '@/lib/activity-meta';
import type { AuditLogRow } from '@/lib/audit';

function IconForAction({ action }: { action: string }) {
  let Icon = IconClock;
  if (action.endsWith('.created')) Icon = IconPlus;
  else if (action.includes('.deleted') || action.includes('_removed')) Icon = IconTrash;
  else if (action.startsWith('media.')) Icon = action === 'media.uploaded' ? IconUpload : action === 'media.deleted' ? IconTrash : IconPhoto;
  else if (action.includes('image_') || action.includes('cover')) Icon = IconPhoto;
  else if (action.startsWith('pdf.')) Icon = IconFileText;
  else if (action.includes('reordered')) Icon = IconArrowsSort;
  else if (action.startsWith('settings.')) Icon = IconSettings;
  else if (action.includes('.updated') || action.includes('_updated') || action.includes('.published') || action.includes('.unpublished') || action === 'product.category_changed') Icon = IconPencil;
  return <Icon size={16} stroke={1.7} aria-hidden />;
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function describe(activity: AuditLogRow): string {
  const a = activity.action;
  const target = activity.entity_name ?? actionLabel(a);
  if (a === 'media.uploaded') return `added a product image to ${target}`;
  if (a === 'media.replaced') return `replaced a product image for ${target}`;
  if (a === 'media.deleted') return `deleted a product image for ${target}`;
  if (a === 'media.reordered') return `reordered product images for ${target}`;
  if (a === 'settings.updated') return 'updated the Catalogue settings';
  if (a === 'settings.cover_updated') return 'updated the Catalogue cover';
  if (a === 'settings.cover_removed') return 'removed the Catalogue cover';
  if (a === 'category.reordered') return 'reordered the Categories';
  if (a.endsWith('.created')) return `created ${target}`;
  if (a.endsWith('.deleted')) return `deleted ${target}`;
  if (a.includes('.published')) return `published ${target}`;
  if (a.includes('.unpublished')) return `unpublished ${target}`;
  if (a === 'pdf.generation_started') return 'started a Catalogue PDF generation';
  if (a === 'pdf.generated') return 'generated the Catalogue PDF';
  if (a === 'pdf.generation_failed') return 'had a Catalogue PDF generation fail';
  return `updated ${target}`;
}

export default function RecentActivity({ activities }: { activities: AuditLogRow[] }) {
  return (
    <section className="mt-8 border border-[var(--line)] bg-[var(--paper)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <div>
          <h2 className="font-serif text-[22px] text-[var(--ink)]">Recent Activity</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">The latest admin actions.</p>
        </div>
        <Link
          href="/admin/activity"
          className="group flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline decoration-[var(--line-strong)] underline-offset-6 transition-colors hover:text-[var(--ink)]"
        >
          View All Activity
          <IconArrowRight size={15} stroke={1.7} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3 px-5 py-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--brand-blue-light)] text-[var(--brand-blue-dark)]">
              <IconForAction action={activity.action} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--ink-2)]">
                <span className="font-medium text-[var(--ink)]">{activity.user_name ?? 'System'}</span>{' '}
                {describe(activity)}
                {activity.status === 'failed' ? (
                  <span className="ml-2 inline-flex px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#a33b2f]">
                    failed
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                {actionLabel(activity.action)} · {entityTypeLabel(activity.entity_type)}
              </p>
            </div>
            <span className="shrink-0 text-xs text-[var(--muted)]">{timeAgo(activity.created_at)}</span>
          </div>
        ))}
        {activities.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--muted)]">No admin activity recorded yet.</p>
        ) : null}
      </div>
    </section>
  );
}