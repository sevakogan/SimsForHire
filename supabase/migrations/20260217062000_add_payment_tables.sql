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
