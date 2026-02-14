-- ============================================================
-- Products catalog table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_number TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sales_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  notes TEXT DEFAULT '',
  manufacturer_website TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_model ON products (model_number);
CREATE INDEX idx_products_type ON products (type);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS for products
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all products"
  ON products FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

CREATE POLICY "Client users can view products"
  ON products FOR SELECT
  USING (auth_role() = 'client' AND auth_status() = 'approved');

-- ============================================================
-- Add product_id reference to items table
-- ============================================================
ALTER TABLE items ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX idx_items_product_id ON items (product_id);
