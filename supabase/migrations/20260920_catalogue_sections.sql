CREATE TABLE IF NOT EXISTS catalogue_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    image_path TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalogue_sections_order ON catalogue_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_catalogue_sections_status ON catalogue_sections(status);
ALTER TABLE catalogue_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published catalogue sections" ON catalogue_sections;
CREATE POLICY "Public can read published catalogue sections" ON catalogue_sections
  FOR SELECT USING (status = 'published');

DROP TRIGGER IF EXISTS update_catalogue_sections_updated_at ON catalogue_sections;
CREATE TRIGGER update_catalogue_sections_updated_at
  BEFORE UPDATE ON catalogue_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
