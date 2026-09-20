-- Product image gallery. Existing products.image values are migrated as image 1.
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_order
  ON product_images(product_id, display_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_one_primary
  ON product_images(product_id)
  WHERE is_primary = true;

CREATE OR REPLACE FUNCTION enforce_product_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM product_images WHERE product_id = NEW.product_id) >= 5 THEN
    RAISE EXCEPTION 'A product cannot have more than 5 images';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_images_limit ON product_images;
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

DROP TRIGGER IF EXISTS product_images_primary_insert ON product_images;
CREATE TRIGGER product_images_primary_insert
  BEFORE INSERT ON product_images
  FOR EACH ROW EXECUTE FUNCTION ensure_product_primary_image();

DROP TRIGGER IF EXISTS product_images_primary_delete ON product_images;
CREATE TRIGGER product_images_primary_delete
  AFTER DELETE ON product_images
  FOR EACH ROW EXECUTE FUNCTION ensure_product_primary_image();

INSERT INTO product_images (product_id, image_url, display_order, is_primary)
SELECT p.id, p.image, 0, true
FROM products p
WHERE p.image IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id
  );

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read product images" ON product_images;
CREATE POLICY "Public can read product images" ON product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id AND p.status = 'published'
    )
  );
