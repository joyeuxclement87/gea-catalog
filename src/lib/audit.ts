import { createServiceClient } from './supabase';
import { getUser } from './auth';

/**
 * Centralised audit logging for the GEA admin panel.
 *
 * Every admin mutation funnels through `logActivity()`. The acting user is
 * always resolved server-side from the authenticated Supabase session — the
 * frontend can never choose or modify who performed an action. Writes go
 * through the service role, which bypasses RLS; there is no client-facing
 * write policy on `activity_logs`, so records are trustworthy and immutable
 * from the UI.
 *
 * Logging is best-effort by design: a failure to write the log never breaks
 * the underlying admin action.
 */

export type AuditEntityType = 'product' | 'category' | 'section' | 'media' | 'catalogue' | 'settings' | 'user';
export type AuditStatus = 'success' | 'failed';

export interface AuditActor {
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
}

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity_type: AuditEntityType;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  status: AuditStatus;
  created_at: string;
}

export interface ActivityQuery {
  page?: number;
  limit?: number;
  search?: string;
  user?: string;
  action?: string;
  entityType?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: 'newest' | 'oldest';
}

export interface ActivityResult {
  logs: AuditLogRow[];
  total: number;
  page: number;
  totalPages: number;
}

/** Actor used for actions that run outside a user session (e.g. cron PDF jobs). */
export const SYSTEM_ACTOR: AuditActor = { user_id: null, user_name: 'System', user_email: null };

/** Resolve the current admin from the Supabase session. Never trusts the client. */
export async function getAuditActor(): Promise<AuditActor> {
  try {
    const user = await getUser();
    if (!user) return SYSTEM_ACTOR;
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const name =
      typeof meta?.full_name === 'string' && meta.full_name
        ? meta.full_name
        : typeof meta?.name === 'string' && meta.name
          ? meta.name
          : null;
    return { user_id: user.id, user_name: name, user_email: user.email ?? null };
  } catch {
    // No request context (in-process debounced jobs, cron) — attribute to System.
    return SYSTEM_ACTOR;
  }
}

export interface LogActivityInput {
  action: string;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityName?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: AuditStatus;
  actor?: AuditActor;
}

/** Append one immutable audit record. Never throws. */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const actor = input.actor ?? (await getAuditActor());
    const supabase = createServiceClient();
    await supabase.from('activity_logs').insert({
      user_id: actor.user_id,
      user_name: actor.user_name,
      user_email: actor.user_email,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      entity_name: input.entityName ?? null,
      description: input.description ?? null,
      metadata: input.metadata && Object.keys(input.metadata).length > 0 ? input.metadata : null,
      status: input.status ?? 'success',
    });
  } catch {
    // Audit logging must never break the underlying admin action.
  }
}

/** Fields that are never part of a change diff. */
const IGNORED_DIFF_FIELDS = new Set(['id', 'created_at', 'updated_at', 'product_images', 'category', 'categorySlug']);

/**
 * Builds a { field: { from, to } } diff between an existing row and incoming
 * fields (the PATCH body). Unchanged and ignored fields are dropped.
 */
export function diffRecord(
  existing: Record<string, unknown> | null | undefined,
  incoming: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  if (!existing) return {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (IGNORED_DIFF_FIELDS.has(key) || value === undefined) continue;
    const current = existing[key];
    const normalize = (v: unknown) => (typeof v === 'string' ? v.trim() : v);
    if (normalize(current) === normalize(value)) continue;
    changes[key] = { from: current, to: value };
  }
  return changes;
}

/**
 * Paginated, searchable, filterable activity feed. Newest first by default.
 * Filters/search run server-side (PostgREST) so the browser never loads the
 * full history.
 */
export async function getActivityLogs(query: ActivityQuery = {}): Promise<ActivityResult> {
  const supabase = createServiceClient();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 30));
  const newestFirst = query.sort !== 'oldest';

  let q = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: !newestFirst })
    .range((page - 1) * limit, page * limit - 1);

  if (query.search?.trim()) {
    const term = `%${query.search.trim()}%`;
    q = q.or(
      `user_name.ilike.${term},user_email.ilike.${term},entity_name.ilike.${term},action.ilike.${term},description.ilike.${term}`,
    );
  }
  if (query.user) q = q.eq('user_id', query.user);
  if (query.action) q = q.eq('action', query.action);
  if (query.entityType) q = q.eq('entity_type', query.entityType);
  if (query.status) q = q.eq('status', query.status);
  if (query.from) q = q.gte('created_at', `${query.from}T00:00:00`);
  if (query.to) q = q.lte('created_at', `${query.to}T23:59:59`);

  const { data, error, count } = await q;

  if (error) {
    // The migration has not been applied yet — degrade gracefully.
    if (
      error.code === 'PGRST205' ||
      error.code === 'PGRST301' ||
      /does not exist/i.test(error.message ?? '')
    ) {
      return { logs: [], total: 0, page: 1, totalPages: 0 };
    }
    throw error;
  }

  return {
    logs: (data ?? []) as AuditLogRow[],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

/** Distinct known actors, for the "User" filter. */
export async function getAuditUsers(): Promise<{ user_id: string | null; user_name: string | null; user_email: string | null }[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('activity_logs')
    .select('user_id, user_name, user_email')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error || !data) return [];

  const seen = new Set<string>();
  const users: { user_id: string | null; user_name: string | null; user_email: string | null }[] = [];
  for (const row of data) {
    if (!row.user_id || seen.has(row.user_id)) continue;
    seen.add(row.user_id);
    users.push(row);
  }
  return users;
}

/** True when the activity_logs table exists (migration applied). */
export async function isActivityTableReady(): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('activity_logs').select('id').limit(1);
    if (!error) return true;
    return !(error.code === 'PGRST205' || error.code === 'PGRST301' || /does not exist/i.test(error.message ?? ''));
  } catch {
    return false;
  }
}

/** Latest activities for the dashboard widget. */
export async function getRecentActivities(limit = 8): Promise<AuditLogRow[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as AuditLogRow[];
  } catch {
    return [];
  }
}