-- Phone is required for race-event registration (existing flow) but optional
-- for waiver signing. Drop the NOT NULL so waiver signers can omit it; the
-- waiver UI keeps phone marked as required for racers via the form-level
-- validation, not the DB constraint.
alter table public.racers alter column phone drop not null;
