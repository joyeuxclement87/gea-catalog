-- Supabase Schema for GEA Catalogue
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT, -- path in storage
    display_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    image TEXT, -- path in storage
    description TEXT,
    price NUMERIC(10, 2), -- optional, for future use
    sku TEXT, -- optional, for future use
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(slug, category_id)
);

-- Product image gallery. Existing products.image values are migrated as image 1.
CREATE TABLE product_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        storage_path TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE catalogue_sections (
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

CREATE INDEX idx_catalogue_sections_order ON catalogue_sections(display_order);
CREATE INDEX idx_catalogue_sections_status ON catalogue_sections(status);

-- Catalogue settings — single publication record for cover, contact, website URL and closing note.
CREATE TABLE catalogue_settings (
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
CREATE UNIQUE INDEX idx_catalogue_settings_singleton ON catalogue_settings ((true));

CREATE INDEX idx_product_images_product_order ON product_images(product_id, display_order);
CREATE UNIQUE INDEX idx_product_images_one_primary ON product_images(product_id) WHERE is_primary = true;

CREATE OR REPLACE FUNCTION enforce_product_image_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM product_images WHERE product_id = NEW.product_id) >= 5 THEN
        RAISE EXCEPTION 'A product cannot have more than 5 images';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_images_limit
    BEFORE INSERT ON product_images
    FOR EACH ROW EXECUTE FUNCTION enforce_product_image_limit();

CREATE OR REPLACE FUNCTION ensure_product_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_primary THEN
        UPDATE product_images
        SET is_primary = false
        WHERE product_id = NEW.product_id AND id <> NEW.id;
    ELSIF TG_OP = 'DELETE' AND OLD.is_primary THEN
        UPDATE product_images
        SET is_primary = true
        WHERE id = (
            SELECT id FROM product_images
            WHERE product_id = OLD.product_id
            ORDER BY display_order, created_at
            LIMIT 1
        );
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_images_primary_insert
    BEFORE INSERT ON product_images
    FOR EACH ROW EXECUTE FUNCTION ensure_product_primary_image();

CREATE TRIGGER product_images_primary_delete
    AFTER DELETE ON product_images
    FOR EACH ROW EXECUTE FUNCTION ensure_product_primary_image();

INSERT INTO product_images (product_id, image_url, display_order, is_primary)
SELECT p.id, p.image, 0, true
FROM products p
WHERE p.image IS NOT NULL;

-- Indexes for performance
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_status ON categories(status);
CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category_status ON products(category_id, status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_sections ENABLE ROW LEVEL SECURITY;

-- Public read policies (only published)
CREATE POLICY "Public can read published categories" ON categories
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read published products" ON products
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read product images" ON product_images
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM products p
                WHERE p.id = product_images.product_id AND p.status = 'published'
            )
        );

    CREATE POLICY "Public can read published catalogue sections" ON catalogue_sections
        FOR SELECT USING (status = 'published');

ALTER TABLE catalogue_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read catalogue settings" ON catalogue_settings
    FOR SELECT USING (true);

-- Admin policies (will be restricted via service role or custom claims)
-- Service role bypasses RLS automatically
