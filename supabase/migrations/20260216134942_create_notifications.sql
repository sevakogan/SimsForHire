-- Create notifications table for tracking all customer actions
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type text NOT NULL,       -- 'items_accepted', 'items_decided', 'client_note', 'item_deleted', 'contact_message'
  title text NOT NULL,      -- Short heading, e.g. "All items accepted"
  body text,                -- Optional detail text
  link text,                -- Optional link path, e.g. "/projects/uuid"
  read_at timestamptz,      -- null = unread
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Fast lookup for unread notifications (bell badge count)
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (created_at DESC)
  WHERE read_at IS NULL;

-- Fast lookup by project
CREATE INDEX IF NOT EXISTS idx_notifications_project
  ON notifications (project_id);

-- RLS: service role has full access (all customer actions use admin client)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "notifications_service_all" ON notifications
  FOR ALL USING (true) WITH CHECK (true);
