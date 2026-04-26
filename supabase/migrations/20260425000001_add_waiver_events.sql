-- ============================================================================
-- WAIVER EVENTS — additive migration
-- ============================================================================
-- Adds a second event type ("waiver") alongside existing "race" events.
--
-- Design:
--   * live_events.event_type → 'race' (default, existing) | 'waiver'
--   * event_waiver_versions  → append-only per-event waiver text history
--   * racers gets 4 audit columns (nullable) — populated only when a row was
--     created via a waiver signature, ignored for race events.
--
-- Backwards-compatible: every existing row defaults to event_type='race' and
-- new audit columns are nullable. No existing query breaks.
-- ============================================================================

-- 1. Distinguish event types --------------------------------------------------
alter table public.live_events
  add column if not exists event_type text not null default 'race'
  check (event_type in ('race', 'waiver'));

-- 2. Per-event waiver versions (append-only) ---------------------------------
create table if not exists public.event_waiver_versions (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.live_events(id) on delete cascade,
  version     integer not null,
  body        text not null,
  created_at  timestamptz not null default now(),
  unique (event_id, version)
);

create index if not exists event_waiver_versions_event_id_idx
  on public.event_waiver_versions(event_id);

-- 3. Audit columns on racers (waiver signers reuse this table) ---------------
alter table public.racers
  add column if not exists waiver_version             integer,
  add column if not exists waiver_accepted_at         timestamptz,
  add column if not exists waiver_accepted_ip         text,
  add column if not exists waiver_accepted_user_agent text;

-- 4. Row-level security on the new table -------------------------------------
-- Service role bypasses RLS. We deliberately do NOT add public read policies
-- here because the public /waiver/[slug] page reads via service-role server
-- actions, not the anon client.
alter table public.event_waiver_versions enable row level security;
