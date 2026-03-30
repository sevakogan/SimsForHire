# Lessons Learned

## 2026-03-29 — Incorrectly concluded two apps were independent
**Mistake:** Analyzed Supabase table names and concluded the Astro site and Next.js app were completely independent because they use different table names. Told the user they had "zero overlapping tables" and "zero shared data flows."
**Correct approach:** The user confirmed the local Next.js app IS the backend of the production Astro site. Different table names don't mean different products — they serve different functions within the same product. Should have asked the user first rather than making definitive conclusions from code analysis alone.
**Rule:** Never conclude two apps in the same project are unrelated based solely on code analysis. Ask the user about the relationship first. The user knows their own product.

## Rules
- Never conclude two apps in the same project are unrelated based solely on code analysis. Ask the user first.
- When the user says something about their own product architecture, trust them over code analysis.
