-- Real "Get started" checklist, backend part 1.
--
-- The existing getting-started-card.tsx checklist is localStorage-only and
-- marks steps done on click, not on real action — so it has no connection
-- to what a user actually did, can't power a server-side nudge, and gives
-- no real funnel data on where people stall. This migration adds the one
-- missing piece of server state (Growth Hub visits — the other three steps
-- already have a real table to check: profiles, saved_opportunities,
-- cv_profiles.generated_at) and a scheduled nudge for anyone stuck at
-- "only profile done" ~24h after signup.

-- ---------------------------------------------------------------------------
-- 1. Growth Hub visit tracking (new — no existing table records this).
-- One row per user: first visit is all the checklist needs ("explored the
-- Growth Hub" is a one-time milestone, not something to track repeatedly).
-- ---------------------------------------------------------------------------

create table public.growth_hub_visits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  first_visited_at timestamptz not null default now()
);

comment on table public.growth_hub_visits is
  'One row per user, written once on their first visit to /growth. Powers the "Explore the Growth Hub" step of the real getting-started checklist — there was previously no server record of this at all.';

alter table public.growth_hub_visits enable row level security;

create policy growth_hub_visits_own on public.growth_hub_visits
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Idempotent upsert so the Growth Hub page can call this on every visit
-- without checking first; only the first call actually inserts a row.
create or replace function public.record_growth_hub_visit()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.growth_hub_visits (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;
end;
$$;

comment on function public.record_growth_hub_visit is
  'Call on every /growth page load. Idempotent — only the first call per user actually writes a row, via on conflict do nothing.';

-- ---------------------------------------------------------------------------
-- 2. New notification_type value for the getting-started nudge.
-- Must run in its own statement/transaction before any statement that uses
-- the new value (Postgres requirement for enum additions).
-- ---------------------------------------------------------------------------

alter type public.notification_type add value if not exists 'getting_started_reminder';
