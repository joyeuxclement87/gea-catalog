import { getActivityLogs, getAuditUsers, isActivityTableReady } from '@/lib/audit';
import { getCategoriesAdmin } from '@/lib/admin-actions';
import ActivityList from './ActivityList';

export const dynamic = 'force-dynamic';

interface ActivityPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    user?: string;
    action?: string;
    entity?: string;
    status?: string;
    from?: string;
    to?: string;
    sort?: string;
  }>;
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  const result = await getActivityLogs({
    page,
    search: params.search,
    user: params.user,
    action: params.action,
    entityType: params.entity,
    status: params.status,
    from: params.from,
    to: params.to,
    sort: params.sort === 'oldest' ? 'oldest' : 'newest',
  }).catch(() => ({ logs: [], total: 0, page: 1, totalPages: 0 }));

  const [users, ready, categories] = await Promise.all([
    getAuditUsers(),
    isActivityTableReady(),
    getCategoriesAdmin().catch(() => []),
  ]);

  const categoryNames: Record<string, string> = {};
  for (const category of categories) {
    if (category && typeof category.id === 'string' && typeof category.name === 'string') {
      categoryNames[category.id] = category.name;
    }
  }

  return (
    <ActivityList
      logs={result.logs}
      users={users}
      categoryNames={categoryNames}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      search={params.search ?? ''}
      user={params.user ?? ''}
      action={params.action ?? ''}
      entity={params.entity ?? ''}
      status={params.status ?? ''}
      from={params.from ?? ''}
      to={params.to ?? ''}
      sort={params.sort === 'oldest' ? 'oldest' : 'newest'}
      ready={ready}
    />
  );
}