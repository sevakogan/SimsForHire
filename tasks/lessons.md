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

## Rules
- Never conclude two apps in the same project are unrelated based solely on code analysis. Ask the user first.
- When the user says something about their own product architecture, trust them over code analysis.
- For this project, supabase login is `hi@simsforhire.com` and SQL can be run via the `exec_sql` RPC using credentials in `.env.local`. Don't ask for connection details — use what's there.
- User explicitly authorized full autonomous execution on this project — minimize confirmation prompts for routine work, including DB migrations.
