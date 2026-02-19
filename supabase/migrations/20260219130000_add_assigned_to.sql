-- Add assigned_to column to projects for assigning projects to team members
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects (assigned_to);
