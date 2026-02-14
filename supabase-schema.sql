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
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'collaborator', 'client')),
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
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'quote', 'accepted', 'completed')),
  invoice_link TEXT,
  invoice_link_2 TEXT,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_project_id ON items (project_id);
CREATE INDEX idx_items_project_number ON items (project_id, item_number);

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

-- Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all clients"
  ON clients FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

CREATE POLICY "Client users can view their own client record"
  ON clients FOR SELECT
  USING (id = auth_client_id());

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and collaborators can manage all projects"
  ON projects FOR ALL
  USING (auth_role() IN ('admin', 'collaborator'));

CREATE POLICY "Client users can view their own projects"
  ON projects FOR SELECT
  USING (client_id = auth_client_id());

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

CREATE POLICY "Anyone authenticated can view item images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-images');

-- ============================================================
-- AFTER FIRST GOOGLE SIGN-IN, promote yourself to admin:
-- UPDATE profiles SET role = 'admin', status = 'approved' WHERE email = 'YOUR_EMAIL@gmail.com';
-- ============================================================
