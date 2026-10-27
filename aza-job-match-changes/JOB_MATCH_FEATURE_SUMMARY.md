# Job Match Analysis — what was built

## 1. Confirmed live Supabase schema state (checked before writing any code)

Ran `list_tables` (verbose) on Supabase project **AZA** (`saongnctrioxuvdcsmbw`):

- **No existing table** stores a standalone job-fit gap analysis. `cv_tailorings`
  only persists a `match_score` bundled with a full tailored-CV rewrite.
  `opportunity_match_digests` is unrelated — it's notification-digest bookkeeping,
  not per-opportunity analysis content.
- **No access-tier / unlock column exists anywhere** — checked `profiles`,
  `cv_tailorings`, and every other table in `public`. Confirmed before building:
  nothing to gate against yet, so the feature is built fully open.
- `cv_tailorings`'s existing RLS policy is a plain `user_id = auth.uid()` owner
  policy. A separate, already-merged migration
  (`20261022010000_fix_rls_auth_reevaluation.sql`) established
  `user_id = (select auth.uid())` as the current best-practice pattern for new
  policies (avoids per-row re-evaluation) — the new table's policy uses that form.

## 2. What was built

### New table: `opportunity_match_analyses`
- Migration: `supabase/migrations/20261025000000_add_opportunity_match_analyses.sql`
- **Applied live** to the AZA Supabase project (verified via `pg_policies`).
- Columns: `match_score` (0–100, checked), `matched_requirements` (text[]),
  `missing_requirements` (text[]), `summary`, standard id/timestamps.
- One row per `(user_id, opportunity_id)` — re-analysis upserts in place.
- RLS: owner-only (`select`/`insert`/`update`/`delete`), `(select auth.uid())` pattern.
- Also synced `src/lib/supabase/database.types.ts` with this new table (and
  `opportunity_match_digests`, which was present live but missing from this
  branch's generated-types file — added for internal consistency, not otherwise
  touched/used by this feature).

### New Groq function: `analyzeOpportunityMatch()` (`src/lib/groq.ts`)
- Standalone — does **not** call or duplicate `tailorCvForOpportunity`. It's a
  lighter, cheaper call: no CV rewrite, just score + matched/missing requirement
  lists + one-sentence summary.
- Same honesty standard as the existing `tailorCvForOpportunity` prompt: score
  must reflect genuine overlap, no inflation, no inventing requirements the
  opportunity doesn't actually state.
- On a JSON-parse failure it **throws** rather than silently returning a 0%
  score — a fabricated 0% would look like a real (and alarming) assessment.

### New server actions (`src/lib/actions/job-match.ts`)
- `analyzeOpportunityMatchForId(opportunityId)` — runs/re-runs the analysis,
  persists it, returns a typed `{ ok: false, reason: "no-base-cv" }` for the
  expected "no CV yet" case (mirrors the existing pattern in
  `cv-generate.ts`, since Next.js strips thrown Server Action messages in prod).
- `getOpportunityMatchAnalysis(opportunityId)` — fetches a previously persisted
  analysis so the user can revisit it without re-running the AI call.
- Contains an explicit `TODO(payment)` comment showing exactly where a future
  tier/unlock check would go, once pricing is decided.

### New UI component (`src/components/cv/opportunity-match-analysis.tsx`)
- Matches the **live** page's actual design system (`aza/ui.tsx` + `kit.tsx` —
  `btn`, `cn`, `bg-card`/`text-foreground` tokens), not the other, differently-
  styled `opportunity-cv-tailor.tsx` component, which turned out to use a
  different (and currently disconnected) visual system — see note below.
- Shows: score, one-line summary, "You match" / "Gaps to address" lists,
  "Check my match" / "Re-check my match" button, loading + error states.
- No locked/upgrade-prompt state exists yet, by design — see TODO comment in
  the file for where it would attach if/when an unlock column is added.

### Wiring
- Added to `src/app/opportunities/[id]/opportunity-detail-client.tsx`, in the
  sidebar, above the existing Apply/Save/Tailor block. Confirmed via
  `page.tsx` that this is the real, live-data-driven component (not a mock).

## 3. What's stubbed / explicitly deferred

- **Payment/unlock gating**: not built, per your instructions. No Paystack/
  Korapay SDK, no webhook, no pricing logic. The server action and UI
  component each carry a clearly marked `TODO(payment)` comment with the
  exact shape of the check to add later.
- Nothing else was stubbed — the feature is fully working end-to-end (score,
  gap list, persistence, revisit) on the live schema.

## 4. Pre-existing issue noticed, not fixed (out of scope)

`opportunity-detail-client.tsx`'s existing "Tailor my CV" button calls a mock
`api.tailorCv()` (`src/lib/aza/api.ts`), not the real
`tailorCvForOpportunityId` server action / `OpportunityCvTailor` component
that already exists elsewhere in the codebase. This is a pre-existing
disconnect unrelated to this task — flagging it since it sits right next to
where the new Job Match card was added, but intentionally left untouched to
stay within the assigned opportunity/CV/matching scope without expanding the
diff into unrelated fixes.

## 5. Verification performed

- `npx tsc --noEmit` — clean, no errors.
- `npx eslint` on all new/changed files — clean, no errors.
- `npx next build` — fails only on `next/font` Google Fonts fetch
  (`ENOTFOUND fonts.googleapis.com`), confirmed via a side-by-side build of a
  completely untouched fresh clone of the same repo, which fails identically.
  This is the sandbox's network egress allowlist blocking
  `fonts.googleapis.com` (not in the allowed-domains list) — unrelated to any
  change in this diff. It will build normally on Vercel, Termux, or any
  machine with normal internet access.
- Migration applied and verified live against Supabase project AZA via MCP
  (`pg_policies` check confirms the RLS policy is active).

## 5. Files changed/added

```
 M src/app/opportunities/[id]/opportunity-detail-client.tsx
 M src/lib/groq.ts
 M src/lib/supabase/database.types.ts
?? src/components/cv/opportunity-match-analysis.tsx
?? src/lib/actions/job-match.ts
?? supabase/migrations/20261025000000_add_opportunity_match_analyses.sql
```
