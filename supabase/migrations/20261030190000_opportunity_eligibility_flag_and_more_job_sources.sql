-- Adds an honest, best-effort eligibility hint to `opportunities`, set by
-- the ingest pipeline (src/lib/ingest/sources.ts flagsRestrictiveEligibility,
-- src/lib/ingest/run.ts) as two new live job sources (Remotive, Arbeitnow)
-- are added alongside the existing Himalayas/Jobicy.
--
-- None of the free, no-auth job sources available reliably state which
-- countries a listing excludes (Himalayas/Jobicy/Arbeitnow have no country
-- field at all; Remotive's candidate_required_location is the best signal
-- found but is still inconsistent). Rather than silently ingesting rows
-- that may not actually be open to every applicant, or guessing a filter
-- that would wrongly exclude valid rows, this column is a visible hint —
-- "this listing's text mentions a residency/location/work-authorization
-- requirement, check before applying" — never a row-level filter. It
-- applies to every job regardless of where the applicant is based; this is
-- not Nigeria- or Africa-specific tagging, since Aza's opportunity feed is
-- global, not single-country.

alter table public.opportunities
  add column if not exists eligibility_flag boolean not null default false;

comment on column public.opportunities.eligibility_flag is
  'Best-effort hint (not a filter): true when the ingest pipeline detected common exclusionary phrasing (e.g. "US only", "must be EU-based") in the listing''s own text. Always show as a "check eligibility" note in the UI, never used to hide or auto-exclude a row — none of the wired job sources reliably state excluded countries, so this flags uncertainty rather than claiming to verify it. Hand-curated rows (source_ref IS NULL) are not touched by the ingest and keep their default of false unless a curator sets it.';

create index if not exists opportunities_eligibility_flag_idx
  on public.opportunities (eligibility_flag)
  where eligibility_flag;
