# SimsForHire — Developer Onboarding

Welcome! This file gives Claude Code everything it needs to get you set up and working.

## Your Mission

You are building the **Store** for SimsForHire — a racing simulator rental company. This includes:

1. **Customer auth** — separate from admin auth. Customers sign up/sign in on the store page to make purchases. Use Supabase Auth with a `customer` role in the `admin_profiles` table (role field already supports: owner, admin, marketing, customer).

2. **Store admin** (`/admin/store`) — currently shows "Coming Soon". Build out: product management (CRUD), inventory, order tracking, pricing.

3. **Public store** (`/store`) — customer-facing storefront where people browse products and purchase. Currently a placeholder page.

4. **Orders system** — checkout flow, order history, payment integration (Stripe recommended).

## Setup (Run These Commands)

```bash
# 1. Clone the repo
git clone https://github.com/sevakogan/SimsForHire.git
cd SimsForHire

# 2. Install dependencies
npm install

# 3. Link to Vercel for env vars (select "sevas-projects-839558f4" → "simsforhire")
npx vercel link

# 4. Pull production env vars
npx vercel env pull .env.local --environment production

# 5. Start dev server
npm run dev
# Site runs at http://localhost:4321

# 6. Create your feature branch
git checkout -b feat/store
```

## Git Workflow

- **ALWAYS work on a feature branch**, never commit directly to `main`
- Push your branch and create a PR to `main` on GitHub
- Vercel auto-deploys `main` on merge
- Seva is working on other parts of the site simultaneously — stay on your branch to avoid conflicts

```bash
# Daily workflow
git add -A
git commit -m "feat: description of what you did"
git push -u origin feat/store

# Stay up to date with main
git fetch origin
git merge origin/main
```

## Key Files You'll Work With

### Existing (modify)
- `src/pages/admin/store.astro` — Admin store page (currently "Coming Soon")
- `src/pages/store.astro` — Public store page (currently placeholder)

### New files you'll create
- `src/pages/store/` — Store pages (product listing, product detail, cart, checkout)
- `src/pages/api/store/` — Store APIs (products CRUD, cart, orders, customer auth)
- `src/components/store/` — Store components
- `src/lib/store/` — Store utilities (cart logic, payment, etc.)
- `src/pages/account/` — Customer account pages (login, register, orders, profile)
- `src/pages/api/account/` — Customer auth APIs

### Don't touch (Seva's areas) — CRITICAL
- `src/components/s4m/` — Live event system
- `src/pages/live/` — Live leaderboard pages
- `src/pages/api/live-events/` — Live event APIs
- `src/lib/s4m/` — Event system utilities
- `src/pages/admin/` — Admin pages (except `store.astro` which is yours)
- `src/components/admin/` — Admin components
- `src/lib/admin-auth.ts` — Admin auth system
- Any marketing site components (`Hero.astro`, `Fleet.astro`, etc.)

### Shared files (coordinate with Seva before editing)
- `src/components/admin/Sidebar.astro` — if you need a nav link, ask Seva to add it
- `src/styles/global.css` — if you need new theme tokens
- `package.json` — if you need new dependencies, add them on your branch (merge will combine)
- `src/env.d.ts` — if you add new env vars
- `src/lib/supabase.ts` — shared Supabase client (probably don't need to change)

## Parallel Work Rules

You and Seva work simultaneously on separate branches. Here's how it stays clean:

1. **Your branch:** `feat/store` — always work here, never on `main`
2. **Seva works on:** `main` or `feat/seva-*` branches
3. **Stay in your lane** — only touch files in "Your files" section above
4. **Sync with main regularly:**
   ```bash
   git fetch origin
   git merge origin/main
   ```
   Do this daily or before creating a PR to avoid big merge conflicts.
5. **When ready to deploy:** Create a PR from `feat/store` → `main` on GitHub
6. **Build must pass:** Run `npm run build` before pushing. If it fails, fix it.
7. **Supabase changes:** Put SQL scripts in `docs/migrations/` with a descriptive filename like `002-store-tables.sql`. Tell Seva to run them, or ask for dashboard access.
8. **Don't force-push to main.** Don't merge to main without a PR.

## Tech Stack Rules

- **Astro 5** with **React 19** islands — interactive components use `client:load`
- **Tailwind CSS v4** — `@theme` directive, no inline styles on Astro components
- **Supabase** for database + auth + storage — server client at `src/lib/supabase.ts`
- **TypeScript** always
- **npm** as package manager
- Dynamic pages need `export const prerender = false` at the top of frontmatter
- Import `src/styles/global.css` in any standalone pages for Tailwind to work

## Supabase

- **Project:** `fzbadqjwyapipvwekgmu`
- **Existing tables:** leads, live_events, event_config, racers, admin_profiles
- You'll create new tables for: `products`, `orders`, `order_items`, `cart` (or similar)
- Ask Seva for Supabase dashboard access if needed, or provide SQL scripts for him to run

## Admin Panel Design System

The admin panel uses an Apple-style light theme. Match this for store admin pages:
- Background: `#F5F5F7`, Cards: white with `1px solid #E5E5E7`, `border-radius: 12-14px`
- Text: `#1D1D1F`, Secondary: `#86868B`, Tertiary: `#AEAEB2`
- Accent red: `#E10600`, Green: `#30D158`, Blue: `#2563EB`
- Font: DM Sans (loaded in AdminLayout)
- Use `AdminLayout` for admin store pages: `import AdminLayout from '../../layouts/AdminLayout.astro'`

## Customer Auth (Separate from Admin)

- Admin auth uses cookie-based sessions (`s4h_admin_token`) — DON'T reuse this for customers
- Create a separate customer auth flow:
  - Customer sign up / sign in pages at `/account/login`, `/account/register`
  - Use Supabase Auth (same project) but with a different cookie name (e.g., `s4h_customer_token`)
  - Customer profiles go in `admin_profiles` table with `role = 'customer'`
  - Customers should NOT have access to `/admin/*` routes

## Deployment

- Push to your branch, create PR to `main`
- Vercel preview deploys automatically on PR
- When PR is merged to `main`, Vercel deploys to production
- Before merging to main, bump `src/lib/build-info.json` (build number + date in Pacific time)

## Questions?

- Ping Seva for Supabase access, env vars, or design decisions
- Read `CLAUDE.md` in the repo root for full architecture details
- The admin panel is at `simsforhire.com/admin` (login with your invited credentials)
