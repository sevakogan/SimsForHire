-- Create company_info table (with logo_scale for resizable logo)
CREATE TABLE IF NOT EXISTS company_info (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  ein text NOT NULL DEFAULT '',
  logo_url text,
  logo_scale integer NOT NULL DEFAULT 100,
  updated_at timestamptz NOT NULL DEFAULT now()
);
