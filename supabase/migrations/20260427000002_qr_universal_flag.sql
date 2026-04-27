-- ============================================================================
-- UNIVERSAL ("GENERAL") QR FLAG
-- ============================================================================
-- Adds an is_universal flag to qr_redirects. Exactly one row may have
-- is_universal=true at any time, enforced by a partial unique index.
--
-- The "General QR" is the print-once, repoint-forever flagship: one physical
-- QR that the user repoints at each new event by clicking
-- "Point General QR Here" on the event detail page.
-- ============================================================================

alter table public.qr_redirects
  add column if not exists is_universal boolean not null default false;

create unique index if not exists qr_redirects_one_universal_idx
  on public.qr_redirects ((is_universal))
  where is_universal = true;

-- Seed: a single General QR with stable token "GENERAL1". Default destination
-- points at the admin /events page so an admin scanning fresh can navigate;
-- once any waiver event exists, click "Point General QR Here" to redirect.
insert into public.qr_redirects (token, destination_url, label, is_universal)
values (
  'GENERAL1',
  '/events',
  'General QR (universal)',
  true
)
on conflict (token) do nothing;
