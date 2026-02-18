-- SimsForHire Supabase Schema
-- Online store backend for managing clients, projects, and item quotes
-- Run this in Supabase SQL Editor

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Profiles — extends auth.users
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'collaborator', 'client', 'employee')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  client_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_status ON profiles (status);
CREATE INDEX idx_profiles_client_id ON profiles (client_id);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Clients — businesses / customers
-- ============================================================
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_created_by ON clients (created_by);

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- FK from profiles.client_id -> clients.id (deferred to avoid circular dependency)
ALTER TABLE profiles
  ADD CONSTRAINT profiles_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- ============================================================
-- Projects — belong to a client
-- ============================================================
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'quote', 'submitted', 'accepted', 'paid', 'preparing', 'shipped', 'received', 'completed')),
  invoice_number TEXT,
  invoice_link TEXT,
  invoice_link_2 TEXT,
  date_required DATE,
  fulfillment_type TEXT NOT NULL DEFAULT 'delivery' CHECK (fulfillment_type IN ('pickup', 'delivery', 'white_glove')),
  notes TEXT NOT NULL DEFAULT '',
  tax_percent NUMERIC(6, 3) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(6, 3) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'amount')),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  share_token UUID UNIQUE,
  shipping_address TEXT,
  contract_viewed_at TIMESTAMPTZ,
  contract_signed_at TIMESTAMPTZ,
  contract_signed_by TEXT,
  contract_signature_data TEXT,
  contract_initials_data TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_client_id ON projects (client_id);
CREATE INDEX idx_projects_status ON projects (status);

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Items — belong to a project
-- ============================================================
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_number INT NOT NULL,
  item_type TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'product',
  description TEXT NOT NULL DEFAULT '',
  item_link TEXT,
  retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  retail_shipping NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(6, 2) NOT NULL DEFAULT 0,
  my_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  my_shipping NUMERIC(12, 2) NOT NULL DEFAULT 0,
  price_sold_for NUMERIC(12, 2),
  image_url TEXT,
  notes TEXT DEFAULT '',
  model_number TEXT NOT NULL DEFAULT '',
  seller_merchant TEXT NOT NULL DEFAULT '',
  acceptance_status TEXT NOT NULL DEFAULT 'pending' CHECK (acceptance_status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_project_id ON items (project_id);
CREATE INDEX idx_items_project_number ON items (project_id, item_number);
CREATE INDEX idx_items_category ON items (category);

CREATE TRIGGER set_items_updated_at
  BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Helper functions for RLS
-- ============================================================
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_status()
RETURNS TEXT AS $$
  SELECT status FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_client_id()
RETURNS UUID AS $$
  SELECT client_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Employee–Client assignments (many-to-many)
-- ============================================================
CREATE TABLE employee_client_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, client_id)
);

CREATE INDEX idx_eca_employee ON employee_client_assignments (employee_id);
CREATE INDEX idx_eca_client ON employee_client_assignments (client_id);

CREATE OR REPLACE FUNCTION auth_employee_client_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(
    ARRAY(SELECT client_id FROM employee_client_assignments WHERE employee_id = auth.uid()),
    '{}'::uuid[]
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'client',
    'pending'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all profiles"
  ON profiles FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Employee–Client assignments RLS
ALTER TABLE employee_client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage employee assignments"
  ON employee_client_assignments FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

CREATE POLICY "Employees can view their own assignments"
  ON employee_client_assignments FOR SELECT
  USING (employee_id = auth.uid());

-- Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all clients"
  ON clients FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

CREATE POLICY "Client users can view their own client record"
  ON clients FOR SELECT
  USING (id = auth_client_id());

CREATE POLICY "Employees can view their assigned clients"
  ON clients FOR SELECT
  USING (auth_role() = 'employee' AND id = ANY(auth_employee_client_ids()));

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all projects"
  ON projects FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

CREATE POLICY "Client users can view their own projects"
  ON projects FOR SELECT
  USING (client_id = auth_client_id());

CREATE POLICY "Employees can view projects for assigned clients"
  ON projects FOR SELECT
  USING (auth_role() = 'employee' AND client_id = ANY(auth_employee_client_ids()));

CREATE POLICY "Employees can update projects for assigned clients"
  ON projects FOR UPDATE
  USING (auth_role() = 'employee' AND client_id = ANY(auth_employee_client_ids()))
  WITH CHECK (auth_role() = 'employee' AND client_id = ANY(auth_employee_client_ids()));

-- Items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all items"
  ON items FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

CREATE POLICY "Client users can view their own items"
  ON items FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth_client_id()
    )
  );

CREATE POLICY "Employees can manage items for assigned clients"
  ON items FOR ALL
  USING (
    auth_role() = 'employee'
    AND project_id IN (
      SELECT id FROM projects WHERE client_id = ANY(auth_employee_client_ids())
    )
  );

-- ============================================================
-- Storage bucket for item images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Admins and collaborators can upload item images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'item-images'
    AND auth_role() IN ('admin', 'collaborator')
  );

CREATE POLICY "Admins and collaborators can update item images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'item-images'
    AND auth_role() IN ('admin', 'collaborator')
  );

CREATE POLICY "Admins and collaborators can delete item images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'item-images'
    AND auth_role() IN ('admin', 'collaborator')
  );

CREATE POLICY "Employees can upload item images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'item-images' AND auth_role() = 'employee');

CREATE POLICY "Employees can update item images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'item-images' AND auth_role() = 'employee');

CREATE POLICY "Anyone authenticated can view item images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-images');

-- ============================================================
-- Products — reusable catalog items
-- ============================================================
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_number TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'product',
  description TEXT NOT NULL DEFAULT '',
  retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sales_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  notes TEXT DEFAULT '',
  manufacturer_website TEXT,
  seller_merchant TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_model ON products (model_number);
CREATE INDEX idx_products_type ON products (type);
CREATE INDEX idx_products_category ON products (category);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add product_id reference to items
ALTER TABLE items ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX idx_items_product_id ON items (product_id);

-- Products RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all products"
  ON products FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

CREATE POLICY "Client users can view products"
  ON products FOR SELECT
  USING (auth_role() = 'client' AND auth_status() = 'approved');

CREATE POLICY "Employees can view products"
  ON products FOR SELECT
  USING (auth_role() = 'employee' AND auth_status() = 'approved');

-- ============================================================
-- SHIPMENTS
-- ============================================================

CREATE TABLE shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  carrier_name TEXT NOT NULL DEFAULT '',
  tracking_url TEXT NOT NULL DEFAULT '',
  tracking_number TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_transit'
    CHECK (status IN ('label_created', 'in_transit', 'out_for_delivery', 'delivered')),
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_project_id ON shipments (project_id);

CREATE TRIGGER set_shipments_updated_at
  BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all shipments"
  ON shipments FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

-- ============================================================
-- CONTACT MESSAGES
-- ============================================================

CREATE TABLE contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL DEFAULT '',
  sender_email TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_messages_project_id ON contact_messages (project_id);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all contact messages"
  ON contact_messages FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

-- ============================================================
-- Sellers — saved seller/merchant names for autocomplete
-- ============================================================
CREATE TABLE sellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sellers_name ON sellers (name);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sellers"
  ON sellers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and collaborators can manage sellers"
  ON sellers FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

-- ============================================================
-- Product Types — managed product type categories with colors
-- ============================================================
CREATE TABLE product_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color_key TEXT NOT NULL DEFAULT 'gray',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_types_name ON product_types (name);

ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view product types"
  ON product_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and collaborators can manage product types"
  ON product_types FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

-- ============================================================
-- Payment Settings — single-row, white-label Stripe config
-- ============================================================
CREATE TABLE payment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_publishable_key TEXT NOT NULL DEFAULT '',
  stripe_secret_key TEXT NOT NULL DEFAULT '',
  stripe_webhook_secret TEXT NOT NULL DEFAULT '',
  payments_enabled BOOLEAN NOT NULL DEFAULT false,
  accepted_payment_methods TEXT[] NOT NULL DEFAULT ARRAY['card'],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Payments — per-project payment records
-- ============================================================
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'expired')),
  customer_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_project_id ON payments (project_id);
CREATE INDEX idx_payments_stripe_session_id ON payments (stripe_session_id);
CREATE INDEX idx_payments_status ON payments (status);

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all payments"
  ON payments FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

-- ============================================================
-- AFTER FIRST GOOGLE SIGN-IN, promote yourself to admin:
-- UPDATE profiles SET role = 'admin', status = 'approved' WHERE email = 'YOUR_EMAIL@gmail.com';
-- ============================================================
