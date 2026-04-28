-- ============================================================================
-- QR REDIRECTS — dynamic QR codes
-- ============================================================================
-- A "dynamic" QR pattern: every printed QR encodes a stable token URL
-- (/qr/<token>) that hits this app's redirect handler. The handler looks up
-- the token here and 302's to whatever destination_url currently says.
-- The token never changes, but the destination is mutable, so a single
-- printed QR can be re-pointed at any time.
-- ============================================================================

create table if not exists public.qr_redirects (
  token            text primary key,                   -- 8-char base62 (random)
  destination_url  text not null,                      -- where the QR currently points
  event_id         uuid references public.live_events(id) on delete set null,
  label            text,                               -- admin-only nickname
  scan_count       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists qr_redirects_event_id_idx on public.qr_redirects(event_id);

alter table public.qr_redirects enable row level security;
-- service-role only (admin app reads/writes via service key, public redirect
-- handler reads via service key on the server). No public RLS policies.

-- ----------------------------------------------------------------------------
-- Backfill: every existing waiver event gets a primary QR redirect that
-- points to its public sign page. Tokens are derived deterministically from
-- the event id so re-running the migration is idempotent (no dup tokens).
-- ----------------------------------------------------------------------------
insert into public.qr_redirects (token, destination_url, event_id, label)
select
  -- 8-char token: base32-ish encoding of the first 5 bytes of md5(id)
  -- (deterministic so re-running won't insert duplicates).
  upper(substr(md5(le.id::text), 1, 8)) as token,
  '/waiver/' || le.slug                  as destination_url,
  le.id                                  as event_id,
  le.name                                as label
from public.live_events le
where le.event_type = 'waiver'
  and not exists (
    select 1 from public.qr_redirects r where r.event_id = le.id
  )
on conflict (token) do nothing;
