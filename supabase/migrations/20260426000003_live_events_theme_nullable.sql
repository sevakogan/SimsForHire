-- live_events.theme had a NOT NULL constraint without a default, causing both
-- the existing createEvent and the new createWaiverEvent server actions to
-- fail when no theme was provided (they pass null). Drop the constraint —
-- theme is purely cosmetic and absence is a valid state.
alter table public.live_events alter column theme drop not null;
