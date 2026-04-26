-- ============================================================================
-- E-SIGNATURE CAPTURE — additive migration
-- ============================================================================
-- Adds drawn-signature image + marketing opt-in flag to racers, both for the
-- waiver-signing flow. Florida E-SIGN compliance:
--   * (a) timestamp           → already on waiver_accepted_at
--   * (b) ip + user agent     → already on waiver_accepted_ip / _user_agent
--   * (c) document version    → already on waiver_version
--   * (d) drawn signature     → NEW: signature_data_url
--   * marketing consent       → NEW: marketing_opt_in (default true; signer can uncheck)
-- ============================================================================

alter table public.racers
  add column if not exists signature_data_url text,
  add column if not exists marketing_opt_in   boolean not null default true;
