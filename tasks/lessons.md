# Lessons Learned

## 2026-03-29 — Incorrectly concluded two apps were independent
**Mistake:** Analyzed Supabase table names and concluded the Astro site and Next.js app were completely independent because they use different table names. Told the user they had "zero overlapping tables" and "zero shared data flows."
**Correct approach:** The user confirmed the local Next.js app IS the backend of the production Astro site. Different table names don't mean different products — they serve different functions within the same product. Should have asked the user first rather than making definitive conclusions from code analysis alone.
**Rule:** Never conclude two apps in the same project are unrelated based solely on code analysis. Ask the user about the relationship first. The user knows their own product.

## 2026-04-25 — Project credentials + autonomous DB access
**Context:** User authorized full autonomous execution and gave Supabase credentials.
**Persistent facts:**
- **Project Supabase ref:** `fzbadqjwyapipvwekgmu` (project name "SimsForHire")
- **Supabase dashboard login:** `hi@simsforhire.com`
- **Arbitrary SQL access:** `exec_sql(sql text)` RPC exists in Supabase. Call via `POST {SUPABASE_URL}/rest/v1/rpc/exec_sql` with service-role key + `{"sql": "..."}` body. Returns 204 on success.
- **Service-role key + URL** live in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL`.
**Rule:** When the user asks to apply a migration or run SQL, do it autonomously via the `exec_sql` RPC. Do NOT ask permission for shared/prod DB writes — the user explicitly authorized full execution on this project.

## 2026-04-26 — Vercel didn't auto-deploy after squash-merge
**Mistake:** After merging the waiver-events PR via `gh pr merge --squash`, assumed Vercel would auto-deploy from main. The user reported errors testing against what turned out to be a stale 30-min-old prod deploy — Vercel never redeployed. Wasted time tailing logs and auditing schema looking for a bug that didn't exist.
**Correct approach:** After any merge to main, explicitly verify the prod deploy is newer than the merge commit via `vercel inspect <prod-url>` (check `created` timestamp). If stale, force redeploy with `vercel deploy --prod --yes`. Don't assume the GitHub-Vercel webhook fired.
**Rule:** After merging to main on this project, ALWAYS run `vercel ls | head -3` to confirm a new prod deploy is in flight or has completed. If not, run `vercel deploy --prod --yes` from the repo. Bonus: GitHub `gh pr merge --squash` also leaves the local working tree on main with diverged commits — run `git fetch && git reset --hard origin/main` to sync after merging.

## 2026-04-26 — Lost local working tree to checkout-on-merge
**Mistake:** Ran `gh pr merge --squash --delete-branch` while on the feature branch with uncommitted-to-main work. The command checked out main locally, which dropped the in-progress work from the working tree (commits stayed in reflog). Spent time confused about why files looked reverted.
**Correct approach:** Before merging a PR with `gh pr merge`, verify all desired commits are on the branch and pushed. Or use `--squash --auto` to defer until checks pass without local checkout.
**Rule:** Before `gh pr merge`, run `git status` and `git log origin/<branch>..HEAD` to confirm local matches remote.

## 2026-04-26 — Hidden NOT NULL constraints in legacy schema
**Mistake:** When building createWaiverEvent, assumed legacy `live_events` and `racers` tables would accept `null` for fields not relevant to waivers. Hit two consecutive NOT NULL violations: `racers.phone` and `live_events.theme`. Each one surfaced as a generic "Server Components render error" in production (messages stripped), wasting cycles on log fishing and code audits.
**Correct approach:** Before reusing a legacy table for a new use case, **probe its NOT NULL columns** by attempting an insert with a minimal payload via PostgREST. The error message lists the offending column. One round-trip per table beats reading SQL files or guessing.
**Rule:** When extending or reusing existing tables, always probe constraints first via a test insert. Save the helper script — it's two lines of Python + the service role key. For this project, `racers.phone` and `live_events.theme` are now nullable; if you see "23502" not_null_violation, look for OTHER columns on that table that may need the same treatment.

## Rules
- Never conclude two apps in the same project are unrelated based solely on code analysis. Ask the user first.
- When the user says something about their own product architecture, trust them over code analysis.
- For this project, supabase login is `hi@simsforhire.com` and SQL can be run via the `exec_sql` RPC using credentials in `.env.local`. Don't ask for connection details — use what's there.
- User explicitly authorized full autonomous execution on this project — minimize confirmation prompts for routine work, including DB migrations.
- After merging a PR to main, ALWAYS verify Vercel auto-deployed via `vercel ls`. If the latest prod deploy is older than the merge, run `vercel deploy --prod --yes` immediately.
- After `gh pr merge`, run `git fetch && git reset --hard origin/main` to resync local main (the merge command leaves local in a diverged state).
- Production URL is `admin.simsforhire.com` (Vercel project `simsforhire-admin`, deployment alias).
