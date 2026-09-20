-- Catalogue PDF status — single-row record tracking the one current catalogue PDF.
-- The system keeps exactly one PDF at catalogue-pdfs/catalogue/GEA-Product-Catalogue-2026.pdf
-- and replaces it in place whenever catalogue content changes.

CREATE TABLE IF NOT EXISTS catalogue_pdf_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_path TEXT NOT NULL DEFAULT 'catalogue/GEA-Product-Catalogue-2026.pdf',
    file_name TEXT NOT NULL DEFAULT 'GEA-Product-Catalogue-2026.pdf',
    file_size BIGINT NOT NULL DEFAULT 0,
    generated_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'outdated'
        CHECK (status IN ('current', 'generating', 'failed', 'outdated')),
    content_version INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    pending_since TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Single-row guard: only one PDF status record may exist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogue_pdf_status_singleton ON catalogue_pdf_status ((true));

INSERT INTO catalogue_pdf_status (status, pending_since)
SELECT 'outdated', NOW()
WHERE NOT EXISTS (SELECT 1 FROM catalogue_pdf_status);

ALTER TABLE catalogue_pdf_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read catalogue PDF status" ON catalogue_pdf_status;
CREATE POLICY "Public can read catalogue PDF status" ON catalogue_pdf_status
    FOR SELECT USING (true);

-- Optional: fully automatic regeneration on a schedule (requires pg_net + pg_cron).
-- Enable after deploying, replacing YOUR_APP_URL and YOUR_PDF_CRON_SECRET:
--
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--   select cron.schedule(
--     'gea-catalogue-pdf-check',
--     '*/1 * * * *',
--     $$ select net.http_post(
--          url := 'https://YOUR_APP_URL/api/catalogue/pdf/cron',
--          headers := jsonb_build_object('x-pdf-cron-secret', 'YOUR_PDF_CRON_SECRET')
--        ) $$
--   );