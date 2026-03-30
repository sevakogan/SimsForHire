-- Add archived_at to leads and update status column
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- email_campaigns: campaign definitions
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- campaign_steps: individual emails/SMS within a campaign
CREATE TABLE IF NOT EXISTS campaign_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body_html text NOT NULL DEFAULT '',
  delay_hours integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, step_number)
);

-- lead_campaigns: tracks enrollment per lead
CREATE TABLE IF NOT EXISTS lead_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL,
  campaign_id uuid NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  next_send_at timestamptz,
  completed_at timestamptz,
  UNIQUE(lead_id, campaign_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_lead_id ON lead_campaigns(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_status ON lead_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_next_send ON lead_campaigns(next_send_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign ON campaign_steps(campaign_id, step_number);
