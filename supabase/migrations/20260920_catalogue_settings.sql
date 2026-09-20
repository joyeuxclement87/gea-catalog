-- Catalogue settings — single publication record for cover, contact, website URL and closing note.

CREATE TABLE IF NOT EXISTS catalogue_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_url TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    contact_address TEXT,
    closing_message TEXT,
    cover_image_url TEXT,
    cover_image_path TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Single-row guard: only one settings row may exist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogue_settings_singleton ON catalogue_settings ((true));

INSERT INTO catalogue_settings (website_url, contact_phone, contact_email, contact_address, closing_message)
SELECT
    'https://www.globalengineeringagency.com',
    '+250 788 632 620',
    'info@globalengineeringagency.com',
    'Umukindo House, ground floor, 5 doors from BK',
    'For product information, technical details, and quotations, contact Global Engineering Agency directly. This catalogue is for product reference; pricing and ordering are handled separately.'
WHERE NOT EXISTS (SELECT 1 FROM catalogue_settings);

ALTER TABLE catalogue_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read catalogue settings" ON catalogue_settings;
CREATE POLICY "Public can read catalogue settings" ON catalogue_settings
    FOR SELECT USING (true);