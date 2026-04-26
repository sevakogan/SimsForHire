# Plan: New Waiver Event Type

## Context

Today every event in `/events` is a **live karting event** — racers join a queue, run laps, get times. The user wants a second event type: a **Waiver Event** that just shows a waiver, collects signatures (name + contact), and gives the admin a printable QR code pointing at the public sign page. Same admin shell, same Supabase backend, completely different public surface.

We have a portable `qr-waiver-bundle` at `/Users/seva/Documents/Claude - Code/_exports/qr-waiver-bundle/` with battle-tested pieces:
- `QrGenerator.tsx` — 5-variant QR PNG exporter with logo overlay
- `WaiverScrollGate.tsx` — scroll-to-bottom gate + agreement checkbox
- `WaiverEditorClient.tsx` — admin editor with version history
- `schema/waiver-schema.sql` — append-only `waiver_versions` + `app_settings`
- `recordWaiverAcceptance.ts` — audit-column builder (version, ip, user-agent, timestamp)

The bundle's default model is **one global active waiver** shared across all signups. We need **per-event waivers**, so we adapt the audit-trail idea (snapshot text + version + IP + UA on each signature) but key the waiver text to the event row, not a global pointer.

---

## Design

### 1. Schema (one migration)

`supabase/migrations/<timestamp>_add_waiver_events.sql`:

```sql
-- 1. Distinguish event types
alter table public.live_events
  add column if not exists event_type text not null default 'race'
  check (event_type in ('race','waiver'));

-- 2. Per-event waiver versioning (append-only)
create table if not exists public.event_waiver_versions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.live_events(id) on delete cascade,
  version integer not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (event_id, version)
);

-- 3. Audit columns on racers (waiver signers reuse this table)
alter table public.racers
  add column if not exists waiver_version integer,
  add column if not exists waiver_accepted_at timestamptz,
  add column if not exists waiver_accepted_ip text,
  add column if not exists waiver_accepted_user_agent text;
```

**Why reuse `racers`:** zero new query code on the admin side (`getEvents`/`getEventStats` keep working). Existing queue/results filters key on `lap_time`, so signers (`lap_time=null, queue_pos=null`) won't pollute race views. Detail view branches on `event_type` to render "X signed" vs "X racers · Y in queue · Z done".

**Why per-event versioning instead of global:** each waiver event is for a different client/dealer with different language. A single `waiver_active_version` doesn't work.

### 2. Files to add

| Path | Purpose | Source |
|---|---|---|
| `src/components/qr/QrGenerator.tsx` | QR PNG exporter | Copy from bundle (no changes) |
| `src/components/waiver/WaiverScrollGate.tsx` | Public scroll gate | Copy from bundle (no changes) |
| `src/components/waiver/WaiverEditor.tsx` | Admin waiver editor | Adapt `WaiverEditorClient.tsx` to scope by `event_id` instead of global |
| `src/components/events/new-waiver-event-form.tsx` | New-waiver create form | New (mirrors `new-event-form.tsx` minus PIN/track, plus waiver textarea) |
| `src/components/events/waiver-event-detail.tsx` | Waiver event admin view (QR + signers list + waiver editor) | New |
| `src/app/(dashboard)/events/new-waiver/page.tsx` | Route for the new-waiver form | New |
| `src/app/waiver/[slug]/page.tsx` | **Public** waiver sign page | New |
| `src/app/waiver/[slug]/sign-form.tsx` | Client form (WaiverScrollGate + name/phone/email) | New |
| `src/lib/actions/waiver-events.ts` | Server actions: `createWaiverEvent`, `publishWaiverVersion`, `recordWaiverSignature`, `getActiveWaiver`, `listSigners` | New |

### 3. Files to modify

- **`src/types/events.ts`** — add `event_type: 'race' \| 'waiver'` to `LiveEvent`; add `EventWaiverVersion` type; extend `Racer` with optional waiver audit fields.
- **`src/components/events/events-view.tsx`** — add second button **"+ New Waiver Event"** at line 64 next to existing "+ New Event"; on each card, branch the "Live ↗" link by `event_type` (`/live/[slug]` for race, `/waiver/[slug]` for waiver) and the stats line ("X signed" instead of racers/queue/done).
- **`src/app/(dashboard)/events/[slug]/page.tsx`** — branch on `event.event_type`: render existing detail for race, render `<WaiverEventDetail>` for waiver.
- **`src/lib/actions/events.ts`** — `getEventStats` for waiver events should return `{ totalRacers, inQueue: 0, completed: 0 }` where totalRacers counts rows (already does). No change needed unless we want a renamed `signerCount`.
- **`package.json`** — add `qrcode` + `@types/qrcode`.

### 4. Public page flow (`/waiver/[slug]`)

1. Server component loads event + active waiver version by slug. 404 if not found or `event_type !== 'waiver'`.
2. Renders client form with `<WaiverScrollGate body={activeWaiver.body} />` + name/phone/email inputs.
3. Submit → server action `recordWaiverSignature({ eventId, name, phone, email, waiverVersion })`:
   - Captures IP from headers (`x-forwarded-for`), UA from `user-agent` header
   - Inserts into `racers` with `lap_time=null, queue_pos=null` and the 4 audit columns populated
   - Returns `{ ok, error? }`
4. Success state: thank-you screen.

### 5. QR generation

In `WaiverEventDetail`, render `<QrGenerator url={absoluteWaiverUrl} logoSrc="/logo.png" filenamePrefix={\`qr-waiver-${event.slug}\`} brandDark="#E10600" />`.

`absoluteWaiverUrl` is built from `process.env.NEXT_PUBLIC_SITE_URL ?? request origin` + `/waiver/${event.slug}`.

---

## Build sequence

- [ ] **1. Schema migration** — write + apply via Supabase MCP/SQL editor
- [ ] **2. Install deps** — `npm install qrcode && npm install -D @types/qrcode`
- [ ] **3. Copy QR + scroll-gate components** unchanged from bundle into `src/components/qr/` and `src/components/waiver/`
- [ ] **4. Types** — extend `src/types/events.ts` with `event_type`, `EventWaiverVersion`, racer audit fields
- [ ] **5. Server actions** — `src/lib/actions/waiver-events.ts` with createWaiverEvent / publishWaiverVersion / recordWaiverSignature / getActiveWaiver / listSigners
- [ ] **6. Admin: new-waiver form + route** — `new-waiver-event-form.tsx` + `(dashboard)/events/new-waiver/page.tsx`
- [ ] **7. Admin: events-view button + branched card** — modify `events-view.tsx`
- [ ] **8. Admin: waiver event detail** — `waiver-event-detail.tsx` (QR + signers list + waiver editor) + branch in `[slug]/page.tsx`
- [ ] **9. Public sign page** — `app/waiver/[slug]/page.tsx` + `sign-form.tsx`
- [ ] **10. Verify end-to-end** — create waiver event → load /waiver/[slug] in incognito → sign → see signer in admin

## Verification

- `npm run lint && npm run build` — types + ESLint clean
- Manual: create waiver event "test-waiver", visit `localhost:3000/waiver/test-waiver`, sign with throwaway data, confirm row in `racers` has `waiver_version`, `waiver_accepted_ip`, `waiver_accepted_user_agent`, `waiver_accepted_at` populated
- QR: download a PNG, scan with phone, confirms it opens the right URL
- Existing race events still load and behave identically (regression check on `/events` and any active `/events/[slug]`)

## Out of scope (explicit non-goals)

- Editing an existing waiver event's *type* (race ↔ waiver)
- SMS confirmation to signers (existing `sms_*` racer fields stay null)
- CSV export of signers (separate ask if needed)
- Multi-language waivers
- Astro-side public page (we're keeping public surface in this Next.js app — no cross-repo coordination)

## Decisions locked

- **QR filename + URL**: derived from event slug. `filenamePrefix={\`qr-waiver-${event.slug}\`}`, URL = `${origin}/waiver/${event.slug}`. Origin resolved at request time from `headers().get('host')` (no env var dependency).
- **QR logo**: render WITHOUT a center badge in v1 (omit `logoSrc` prop). User will drop a logo file in `public/` later and we wire it then — keeps v1 unblocked.
