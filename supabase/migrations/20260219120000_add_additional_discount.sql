-- Add additional_discount column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS additional_discount NUMERIC(12, 2) NOT NULL DEFAULT 0;
