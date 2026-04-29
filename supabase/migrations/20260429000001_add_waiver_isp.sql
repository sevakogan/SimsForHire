-- Add ISP / carrier name to waiver-signer rows so the leads table can show
-- "Verizon", "Comcast", "T-Mobile", etc. at a glance. Populated server-side
-- via ipinfo.io enrichment in recordWaiverSignature.
alter table public.racers
  add column if not exists waiver_accepted_isp text;
