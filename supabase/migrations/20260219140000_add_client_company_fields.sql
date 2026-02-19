-- Add company/business fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram TEXT;
