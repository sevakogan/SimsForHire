# SimsForHire — Astro Site

## Quick Start

```bash
# Clone the repo
git clone https://github.com/sevakogan/SimsForHire.git
cd SimsForHire

# Install dependencies
npm install

# Pull environment variables from Vercel (requires Vercel CLI auth)
npx vercel link          # Select "sevas-projects-839558f4" → "simsforhire"
npx vercel env pull .env.local --environment production

# Start dev server
npm run dev              # http://localhost:4321
```

## Project Overview

SimsForHire is a **racing simulator rental company** website with:
- **Marketing site** — homepage, events portfolio, contact/lease forms
- **Admin panel** (`/admin/`) — leads, events management, ads, profiles, store (coming soon)
- **Live event system** (`/live/[eventSlug]/`) — real-time leaderboards, driver registration, queue management, lap time entry

## Tech Stack

- **Framework:** Astro 5 with React 19 islands (`client:load` for interactive components)
- **Styling:** Tailwind CSS v4 (`@theme` directive in `src/styles/global.css`)
- **Database + Auth:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Integrations:** Twilio (SMS), SendGrid (email), Anthropic (OCR), Resend (marketing email)
- **Deployment:** Vercel (auto-deploys from `main` branch)
- **Package manager:** npm

## Architecture

### Directory Structure
```
src/
├── components/
│   ├── admin/          # Admin panel components (Sidebar.astro)
│   ├── s4m/            # Live event React components (islands)
│   │   ├── admin/      # Event staff panel (PinGate, QueueManager, ResultsView, EventSettings)
│   │   ├── LeaderboardIsland.tsx   # Wrapper: EventProvider + Toast + LeaderboardLive
│   │   ├── RegisterIsland.tsx      # Wrapper: EventProvider + Toast + RegisterForm
│   │   └── ...
│   └── *.astro         # Marketing site components
├── hooks/              # React hooks (useLeaderboard, useQueue, useConfig) — Supabase realtime
├── lib/
│   ├── s4m/            # Live event utilities (types, themes, email, SMS, OCR, helpers)
│   ├── supabase.ts     # Server-side Supabase client (service role)
│   ├── admin-auth.ts   # Cookie-based admin authentication
│   ├── save-lead.ts    # Lead persistence for forms
│   └── build-info.json # Build number + date (bump on each deploy)
├── pages/
│   ├── admin/          # Admin panel pages (dashboard, events, leads, ads, store, profile)
│   ├── api/
│   │   ├── admin/      # Admin APIs (login, logout, profile, invite, events CRUD)
│   │   └── live-events/# Live event APIs (register, time, racers, config, export, OCR)
│   ├── live/[eventSlug]/ # Live event pages (leaderboard, register, success, admin)
│   ├── races/          # Static race results pages
│   └── events/         # Event portfolio pages
├── styles/global.css   # Tailwind config + custom theme tokens
└── data/               # Static data (races, content)
```

### Key Patterns

**React Islands:** Interactive components (leaderboard, forms, admin panels) are React components rendered with `client:load`. Astro handles SSR and passes data as props. IMPORTANT: Use single wrapper components (e.g., `LeaderboardIsland.tsx`) that bundle `EventProvider + ToastProvider + content` — Astro creates separate React trees per `client:load`, so nested `client:load` components can't share React context.

**Server-rendered dynamic routes:** Pages under `/live/[eventSlug]/` and `/admin/` use `export const prerender = false` to enable server-side rendering with Supabase data fetching.

**Two Supabase clients:**
- `src/lib/supabase.ts` — server-side (service role key via `import.meta.env`)
- `src/lib/s4m/supabase-client.ts` — browser-side (anon key, singleton, for realtime subscriptions)

**Admin auth:** Cookie-based (`s4h_admin_token` + `s4h_admin_refresh`). Uses Supabase Auth with email/password.

**Event staff auth:** PIN-based per event (separate from admin auth). Stored in `sessionStorage` to persist across tab switches.

## Commands

```bash
npm run dev       # Dev server at localhost:4321
npm run build     # Production build
npm run preview   # Preview production build locally
```

## Parallel Development (Seva + Nick)

Two devs work simultaneously on separate branches.

| Developer | Branch prefix | Focus areas |
|-----------|--------------|-------------|
| **Seva** | `seva/*` | Live events, leaderboard, admin panel UI, marketing site, ads |
| **Nick** | `nick/*` | Store, payments, customer auth, authentication flows, invite system |

### Branch Rules

```bash
# Seva starts work
git checkout main && git pull
git checkout -b seva/calendar-fix

# Nick starts work
git checkout main && git pull
git checkout -b nick/stripe-checkout
```

- **Never commit directly to `main`** — always PR
- **Sync with main before starting new work** and before creating a PR
- **Run `npm run build`** before pushing — must pass clean

### Shared Files (Both May Edit — Pull Latest First)

These files are touched by both devs. Before editing, do `git pull origin main`:
- `src/components/admin/Sidebar.astro` — nav links
- `src/styles/global.css` — theme tokens
- `package.json` — dependencies
- `src/env.d.ts` — env var types
- `src/lib/supabase.ts` — Supabase client
- `src/lib/admin-auth.ts` — auth system (Nick may refactor for customer auth)

### Merge Flow

1. Push your branch → create PR to `main` on GitHub
2. Vercel auto-creates a preview deploy for the PR
3. Other dev reviews (or self-merge if non-overlapping)
4. After merge, the other dev syncs: `git fetch origin && git merge origin/main`
5. If both have PRs open: merge one, second dev rebases, then merge the other
6. **Bump `src/lib/build-info.json`** when merging to main (whoever merges last)

### Supabase Migrations

Put SQL scripts in `docs/migrations/` with numbered filenames:
- `001-initial-schema.sql` (already run)
- `002-admin-profiles.sql` (already run)
- `003-store-tables.sql` (Nick creates, Seva runs or vice versa)

### If Merge Conflict Happens

1. `git fetch origin && git merge origin/main`
2. Resolve conflicts in your editor
3. `npm run build` — must pass
4. `git add -A && git commit`
5. Push and update PR

## Git Workflow

- Branch from `main`: `git checkout -b seva/feature` or `git checkout -b nick/feature`
- Push to your branch, create PR to `main`
- Vercel auto-deploys `main` on merge
- **IMPORTANT:** Bump `src/lib/build-info.json` (build number + date in Pacific time) before merging to main
- Don't force-push to `main`

## Environment Variables

Required in `.env.local` (pulled from Vercel):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (for browser-side Supabase)
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_LEADS_EMAIL`
- `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `GOOGLE_ADS_ID`, `SLACK_WEBHOOK_URL`

## Supabase Tables

- `leads` — contact/lease/popup form submissions
- `live_events` — multi-event platform (slug, name, theme, status)
- `event_config` — per-event settings (dealer, PINs, logos, SMS, dates)
- `racers` — driver registrations with lap times and queue positions
- `admin_profiles` — admin user profiles (name, phone, avatar, role)

## Design System (Admin Panel)

Apple-style light theme:
- Background: `#F5F5F7`, Surface: `#FFFFFF`, Border: `#E5E5E7`
- Text: `#1D1D1F`, Secondary: `#86868B`, Tertiary: `#AEAEB2`
- Red: `#E10600`, Green: `#30D158`, Amber: `#FF9F0A`
- Font: DM Sans
- Cards: `border-radius: 12-14px`, white background, 1px border
- Modals: centered, `backdrop-filter: blur(4px)`, 16px border-radius
