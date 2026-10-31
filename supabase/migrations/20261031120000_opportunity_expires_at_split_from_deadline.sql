-- Separates two previously-conflated concepts on `opportunities`:
--
--   deadline    — the REAL application/submission deadline, shown to users.
--                 NULL means "no known deadline" (ongoing/rolling), not
--                 "unknown, so guess one."
--   expires_at  — an INTERNAL housekeeping date: when an ingested row is
--                 swept from the table if it's gone stale. Never shown to
--                 users, never treated as a deadline.
--
-- Background: several live-ingest sources (Jobicy, Devpost's mirror,
-- Scholars4Dev, Remotive, Arbeitnow — see src/lib/ingest/sources.ts) don't
-- return a real deadline for most/any listings. The ingest code used to
-- paper over that by stamping `deadline = today + 92 days` as a fake
-- "deadline," so the row would still eventually get swept by the existing
-- expiry sweep (which deleted ingested rows whose `deadline` had passed).
-- That synthetic date was then rendered to users as if it were the real
-- application deadline (DeadlinePill, DeadlineCountdown, ClosingSoonCard,
-- notifications, the growth assistant, etc.) — e.g. three completely
-- unrelated listings all showing "31 days left" because they were ingested
-- the same day and got the same made-up offset.
--
-- Fix: ingest now writes `deadline = NULL` when a source has no real
-- deadline, and writes the 92-day housekeeping value to the new
-- `expires_at` column instead. The sweep in src/lib/ingest/run.ts switches
-- from filtering on `deadline` to filtering on `expires_at`, so stale
-- no-deadline listings still age out correctly, but nothing fabricated is
-- ever shown to a user.
--
-- This migration also backfills existing rows: see the UPDATE below for
-- the one-time cleanup of deadlines that were fabricated under the old
-- behavior, so already-ingested rows don't keep misleading users until
-- they happen to get re-ingested.

alter table public.opportunities
  add column if not exists expires_at date;

comment on column public.opportunities.expires_at is
  'Internal housekeeping date only — when an ingested (source_ref IS NOT NULL) row with no real deadline should be swept as stale. Never a real application deadline; never rendered to users. NULL for hand-curated rows, which are never swept.';

comment on column public.opportunities.deadline is
  'The real, user-facing application/submission deadline. NULL means no known deadline (ongoing/rolling opportunity) — must never be filled with a fabricated or estimated date. For internal stale-row housekeeping on ingested rows with no real deadline, see expires_at instead.';

create index if not exists opportunities_expires_at_idx
  on public.opportunities (expires_at)
  where source_ref is not null;

-- ---------------------------------------------------------------------
-- Backfill / cleanup of existing rows ingested under the old behavior.
--
-- We cannot tell, after the fact, which ingested rows had a REAL deadline
-- from their source vs. which got the fabricated `today + 92 days` stamp —
-- the ingest code didn't record that distinction. So this takes the
-- conservative, honest position for every row that's still eligible for
-- it:
--
--   - Only touches ingested rows (source_ref IS NOT NULL). Hand-curated
--     rows (source_ref IS NULL) were never touched by the old fake-deadline
--     code path and are left exactly as-is.
--   - Only touches rows from the five sources that ALWAYS fabricated a
--     deadline with no real-deadline attempt at all: jobicy-*, devpost-*,
--     scholars4dev-*, remotive-*, arbeitnow-*. These can be identified
--     unambiguously by their source_ref prefix.
--   - Does NOT touch himalayas-* rows: that source passes through a real
--     `expiryDate` from the API when present, and only falls back to a
--     fabricated date when the source itself had none — we have no way to
--     tell which case applies to an existing row, so rather than guess we
--     leave Himalayas rows as they are. The next ingest run will correct
--     any that were in fact fabricated (Himalayas re-sends expiryDate on
--     every poll).
--   - Does NOT touch grantdesk-* rows: that source actually parses a real
--     "Deadline: DD Mon YYYY" out of the RSS description when present, so
--     an existing deadline there has a real chance of being genuine. Left
--     as-is for the same reason as Himalayas.
--
-- For the five always-fabricated sources: move the existing (fake)
-- deadline into expires_at (preserving the sweep behavior those rows were
-- already relying on), then null out deadline so nothing fake is shown to
-- users going forward.

update public.opportunities
set
  expires_at = deadline,
  deadline = null
where
  source_ref is not null
  and deadline is not null
  and (
    source_ref like 'jobicy-%'
    or source_ref like 'devpost-%'
    or source_ref like 'scholars4dev-%'
    or source_ref like 'remotive-%'
    or source_ref like 'arbeitnow-%'
  );
