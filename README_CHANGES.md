# Aza — Courses ingest + real skill tracking

Branch this was built against: `feat/nextjs-prototype-port`

## How to apply
Unzip into the root of your local Aza repo, overwriting the matching paths
(all paths here mirror the repo structure exactly), then:

```
git add -A
git commit -m "Add course ingest pipeline + resource-based skill progress tracking"
git push
```

## Already live — nothing to do for these
Both Supabase migrations in `supabase/migrations/` were already applied
directly to the production database (project AZA) during development and
verified working. They're included here only so the migration history in
git matches what's actually in the DB — you do not need to re-run them.

- `20261021190936_course_ingest_and_skills_seed.sql` — adds
  `skill_resources.source_ref`, seeds the `skills` table (35 rows across
  all 6 categories)
- `20261021192500_user_skill_resources_completion.sql` — new
  `user_skill_resources` table (real completion records) with RLS

## New files
- `src/lib/ingest/course-sources.ts` — live course fetchers (freeCodeCamp
  RSS + YouTube, Khan Academy YouTube), mirrors the opportunities ingest
  pattern
- `src/lib/ingest/run-courses.ts` — resolves fetched rows to skill IDs,
  upserts into `skill_resources`
- `src/app/api/ingest/courses/route.ts` — manual trigger (POST,
  `x-ingest-secret` header, reuses `INGEST_SECRET` env var)
- `src/app/api/cron/ingest-courses/route.ts` — Vercel Cron trigger (GET,
  reuses `CRON_SECRET`), wired into `vercel.json` at 05:15 UTC daily
- `src/components/mark-complete-button.tsx` — "Mark complete" toggle on
  each course card, drives real progress

## Changed files
- `vercel.json` — added the courses cron entry
- `src/lib/supabase/database.types.ts` — regenerated from the live schema
  (was stale; didn't know about `user_skill_resources` or `source_ref`)
- `src/lib/actions/skills.ts` — removed `updateSkillProgress` (the old
  flat "+10% per click" action with no connection to real activity);
  added `markResourceComplete` / `markResourceIncomplete`, which
  recompute `progress_percent` as (completed resources / total resources)
  for that skill
- `src/app/growth/skills/skill-card.tsx` — removed the "+10%" button;
  now read-only, links to courses for that skill
- `src/app/growth/skills/page.tsx` — passes the raw category slug down
  to SkillCard (needed for the "Find courses" link)
- `src/components/growth/skill-progress-bar.tsx` — a second, unused
  component with the same flat-slider bug; fixed to read-only display
- `src/app/growth/courses/page.tsx` — wired in `MarkCompleteButton` on
  each course card, fetches the user's completed-resource IDs

## What was verified before this was packaged
- `tsc --noEmit`: clean across the whole project (two pre-existing,
  unrelated errors in `reports.ts`/`api.ts` were exposed by the type
  regeneration — not caused by these changes, left alone)
- `next lint`: clean on every touched file
- `next build`: compiled successfully (only failure was a sandboxed
  environment's lack of internet access to Google Fonts — not a code
  issue)
- The ingest parsing logic was tested against real RSS/Atom samples
- The full upsert + skill-resolution flow was run directly against the
  live database, then cleaned up
- The progress recompute math (`markResourceComplete` /
  `markResourceIncomplete`) was run end-to-end against the live database
  using the one existing real user account, confirmed correct in both
  directions (0% → 100% → 0%), then fully reverted — no trace left on
  that account
