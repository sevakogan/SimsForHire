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

## Parallel Development (Two Developers)

This project has two developers working simultaneously on separate branches:

| Developer | Branch | Owns | Do NOT touch |
|-----------|--------|------|--------------|
| **Seva** | `main` or `feat/seva-*` | Everything except store | `src/pages/store/`, `src/pages/api/store/`, `src/components/store/`, `src/lib/store/`, `src/pages/account/`, `src/pages/api/account/` |
| **Store Dev** | `feat/store` | Store + customer accounts | `src/components/s4m/`, `src/pages/live/`, `src/pages/api/live-events/`, `src/lib/s4m/`, `src/pages/admin/` (except `store.astro`) |

### Rules for Conflict-Free Parallel Work

1. **Never commit to `main` directly** — always use feature branches + PRs
2. **Stay in your lanes** — only modify files in your "Owns" column
3. **Shared files** that both might touch (coordinate before editing):
   - `src/components/admin/Sidebar.astro` — nav links
   - `src/styles/global.css` — theme tokens
   - `package.json` — dependencies
   - `src/env.d.ts` — env var types
   - `src/lib/supabase.ts` — shared client
4. **Supabase migrations** — share SQL scripts in `docs/migrations/` so both devs can run them
5. **Merge flow:**
   - Each dev pushes to their branch and creates a PR
   - PR gets reviewed, then merged to `main`
   - After merging, the other dev pulls `main` into their branch: `git fetch origin && git merge origin/main`
   - If both PRs are ready, merge one first, then the second dev rebases/merges before their PR
6. **Build check before PR:** always run `npm run build` — it must pass clean
7. **Bump build info** in `src/lib/build-info.json` only when merging to `main` (whoever merges last bumps it)

## Git Workflow

- Branch from `main` for features: `git checkout -b feat/your-feature`
- Push to your branch, create PR to `main`
- Vercel auto-deploys `main` on merge
- **IMPORTANT:** Bump `src/lib/build-info.json` (build number + date in Pacific time) before pushing to main
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
