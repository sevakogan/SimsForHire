-- Migration: Add UTM tracking columns to leads table
-- Run this in Supabase SQL Editor
-- Date: 2026-03-24

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS utm_source    text,
  ADD COLUMN IF NOT EXISTS utm_medium    text,
  ADD COLUMN IF NOT EXISTS utm_campaign  text,
  ADD COLUMN IF NOT EXISTS utm_term      text,
  ADD COLUMN IF NOT EXISTS utm_content   text,
  ADD COLUMN IF NOT EXISTS gclid         text,
  ADD COLUMN IF NOT EXISTS fbclid        text,
  ADD COLUMN IF NOT EXISTS landing_page  text;

-- Index on utm_source for quick filtering by channel
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads (utm_source);

-- Index on gclid for Google Ads attribution
CREATE INDEX IF NOT EXISTS idx_leads_gclid ON leads (gclid) WHERE gclid IS NOT NULL;

-- Index on fbclid for Meta attribution
CREATE INDEX IF NOT EXISTS idx_leads_fbclid ON leads (fbclid) WHERE fbclid IS NOT NULL;

COMMENT ON COLUMN leads.utm_source   IS 'UTM source parameter (e.g. google, facebook, instagram)';
COMMENT ON COLUMN leads.utm_medium   IS 'UTM medium parameter (e.g. cpc, social, email)';
COMMENT ON COLUMN leads.utm_campaign IS 'UTM campaign name';
COMMENT ON COLUMN leads.utm_term     IS 'UTM term (paid search keyword)';
COMMENT ON COLUMN leads.utm_content  IS 'UTM content (ad variation identifier)';
COMMENT ON COLUMN leads.gclid        IS 'Google Click ID for Ads attribution';
COMMENT ON COLUMN leads.fbclid       IS 'Facebook Click ID for Meta attribution';
COMMENT ON COLUMN leads.landing_page IS 'First page URL the visitor landed on';
