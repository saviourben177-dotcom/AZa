-- Standalone Job Match Analysis: lets a user see their fit score AND a
-- specific list of missing/unmet requirements for an opportunity WITHOUT
-- generating a full tailored CV first. Persisted (not ephemeral) so a user
-- can revisit it, the same way cv_tailorings persists tailored CV content.
--
-- Distinct from cv_tailorings: that table stores a *tailored CV body* plus
-- a bundled match_score, produced by tailorCvForOpportunity() (the heavier,
-- CV-rewriting call). This table stores *only* the gap analysis (score +
-- matched/missing requirement lists), produced by the new, lighter
-- analyzeOpportunityMatch() call, so a user can get the fast "am I wasting
-- my time applying" read before committing to a full CV tailoring pass.
--
-- Confirmed via live schema inspection (list_tables, 2026-10-25) before
-- writing this: no existing table covers standalone gap-analysis
-- persistence. opportunity_match_digests is unrelated (daily notification
-- bookkeeping, not per-opportunity analysis content).
--
-- No access-tier / unlock column exists anywhere in the live schema as of
-- this migration (checked profiles, cv_tailorings, and all other tables).
-- This feature is therefore built fully open for now. See the TODO in
-- src/lib/actions/job-match.ts for where tier-gating would hook in once
-- pricing/payment (Paystack vs Korapay) is decided — out of scope here.

create table if not exists public.opportunity_match_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  match_score smallint not null check (match_score >= 0 and match_score <= 100),
  matched_requirements text[] not null default '{}',
  missing_requirements text[] not null default '{}',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

comment on table public.opportunity_match_analyses is
  'Standalone job-fit gap analysis per user per opportunity: persisted match_score plus matched/missing requirement lists, produced by analyzeOpportunityMatch() in src/lib/groq.ts. Independent of cv_tailorings (which bundles a score with a full tailored CV rewrite) — this is the lighter, faster "should I bother applying" check.';

comment on column public.opportunity_match_analyses.match_score is
  'Persisted 0-100 match percentage. Must reflect genuine overlap between the user''s CV content and the opportunity''s stated requirements — never fabricated or inflated, same honesty standard enforced in tailorCvForOpportunity''s prompt.';

comment on column public.opportunity_match_analyses.matched_requirements is
  'Short list of specific requirements/criteria from the opportunity that the user''s CV does satisfy, as plain strings.';

comment on column public.opportunity_match_analyses.missing_requirements is
  'Short list of specific requirements/criteria from the opportunity that the user''s CV does NOT currently satisfy — the "gap list" that is the core value of this feature.';

create index if not exists opportunity_match_analyses_user_id_idx
  on public.opportunity_match_analyses (user_id);

create index if not exists opportunity_match_analyses_opportunity_id_idx
  on public.opportunity_match_analyses (opportunity_id);

alter table public.opportunity_match_analyses enable row level security;
revoke all on public.opportunity_match_analyses from anon, authenticated;

-- Owner-only, using (select auth.uid()) per the per-row-re-evaluation fix
-- applied to profiles/ideas in 20261022010000_fix_rls_auth_reevaluation.sql
-- (Postgres caches a `(select ...)` sub-select for the statement instead of
-- re-running it per row).
create policy opportunity_match_analyses_owner_all
  on public.opportunity_match_analyses for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.opportunity_match_analyses to authenticated;

-- Keep updated_at current on re-analysis (upsert from the app does a plain
-- upsert, not an UPDATE statement necessarily, but this covers direct
-- UPDATE paths and is cheap insurance).
create or replace function public.set_opportunity_match_analyses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists opportunity_match_analyses_set_updated_at on public.opportunity_match_analyses;
create trigger opportunity_match_analyses_set_updated_at
  before update on public.opportunity_match_analyses
  for each row
  execute function public.set_opportunity_match_analyses_updated_at();
