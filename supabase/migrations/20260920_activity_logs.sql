-- Activity History / Audit Log
-- Append-only audit trail for admin actions. Records are written by the
-- server with the service role (which bypasses RLS). No anon/authenticated
-- write policy exists, so records cannot be forged, edited, or deleted
-- through the public Data API — the trail is immutable from the UI.
--
-- The acting user (user_id / user_name / user_email) is always recorded
-- server-side from the authenticated Supabase session; the frontend can
-- never choose or modify it. No passwords, tokens, or secrets are stored.

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,                    -- auth.users id (kept as text so it survives later user deletion)
    user_name TEXT,
    user_email TEXT,
    action TEXT NOT NULL,            -- e.g. 'product.updated', 'media.uploaded', 'pdf.generated'
    entity_type TEXT NOT NULL,       -- product | category | section | media | catalogue | settings | user
    entity_id TEXT,
    entity_name TEXT,
    description TEXT,
    metadata JSONB,                  -- e.g. {"changes": {"name": {"from": "Samsung S25", "to": "Samsung Galaxy S25"}}}
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for the activity feed (newest-first default + filters).
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_created ON activity_logs(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- The public (anon) role has no access to the audit trail.
REVOKE ALL ON activity_logs FROM anon;

-- Signed-in admins may read the history. Writes never come from the client:
-- only the service role (server-side) writes, so the log is trusted.
DROP POLICY IF EXISTS "Admins can read activity logs" ON activity_logs;
CREATE POLICY "Admins can read activity logs" ON activity_logs
    FOR SELECT TO authenticated USING (true);

-- Ensure the authenticated role can read even where explicit grants are
-- required (PostgREST needs SELECT privilege to expose the table).
GRANT SELECT ON activity_logs TO authenticated;