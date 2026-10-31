-- Visible points/streak layer for the CORE loop (opportunities /
-- team-finder / business), separate from the existing Skills Paths streak
-- (public.user_skill_paths, scoped only to Growth Hub skill paths).
--
-- Reuses the exact streak-counting shape proven by
-- bump_skill_path_streak / 20261025182828_skills_paths_feature.sql:
-- current/longest streak + streak_last_counted_date, incremented at most
-- once per UTC day, reset to 1 on a gap of 2+ days.
--
-- Per product direction: the streak must reward meaningful progress, not
-- habitual app opening, and must not force a user to perform all four
-- qualifying actions daily — ANY ONE of them on a given UTC day keeps the
-- streak alive (this is enforced structurally: every qualifying trigger
-- below calls the same idempotent-per-day bump function, so a user who
-- only ever does one of the four still keeps a continuous streak as long
-- as they do that one thing daily). The qualifying actions, confirmed with
-- the product owner, are:
--   1. Submitting an application (saved_opportunities.status -> 'applied')
--   2. Sending a team join request (join_requests insert)
--   3. A meaningful CV update (cv_profiles.generated_at changing on an
--      already-generated CV — NOT the first-time generation, which is
--      already the "Preview your starter CV" getting-started step, to
--      avoid double-counting the same one-time action as daily progress)
--   4. Posting an idea (ideas insert)
-- Explicitly NOT counted: opening the app, saving opportunities
-- indiscriminately (saved_opportunities insert with status='saved' is not
-- a trigger here — only the status transition to 'applied' counts).

-- ---------------------------------------------------------------------------
-- 1. Per-user core-loop streak state. One row per user (unlike
--    user_skill_paths, which is one row per user per path — the core loop
--    has no "path" to scope by, it's a single app-wide streak).
-- ---------------------------------------------------------------------------

create table public.user_core_streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak_days integer not null default 0,
  longest_streak_days integer not null default 0,
  streak_last_counted_date date,
  last_activity_at timestamptz,
  last_activity_kind text check (
    last_activity_kind is null or last_activity_kind in (
      'application_submitted', 'join_request_sent', 'cv_updated', 'idea_posted'
    )
  ),
  updated_at timestamptz not null default now()
);

comment on table public.user_core_streaks is
  'One row per user: the visible core-loop streak (opportunities/team-finder/business), distinct from the backend-only, Skills-Paths-scoped streak on user_skill_paths. Bumped by bump_core_streak(), called from triggers on the four qualifying real-progress events — never on simple app opens or indiscriminate saves. last_activity_kind records which of the four actions most recently counted, for UI copy like "streak kept by sending a join request today".';

alter table public.user_core_streaks enable row level security;

create policy user_core_streaks_own on public.user_core_streaks
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Any authenticated user can view another's streak count (not the rest of
-- the row) for potential future social/profile display — mirrors the
-- public-profile visibility pattern used by portfolio_entries, scoped to
-- just the two counters via a dedicated view.
create view public.public_core_streaks
  with (security_invoker = true) as
select user_id, current_streak_days, longest_streak_days
from public.user_core_streaks;

comment on view public.public_core_streaks is
  'Public-safe projection of user_core_streaks (just the counters) for showing a streak badge on a profile other than one''s own. security_invoker=true so it still respects RLS on the base table rather than bypassing it.';

-- ---------------------------------------------------------------------------
-- 2. Streak bump: identical day-counting logic to bump_skill_path_streak,
--    applied to the single app-wide row instead of a per-path row.
-- ---------------------------------------------------------------------------

create or replace function public.bump_core_streak(p_user_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_row public.user_core_streaks%rowtype;
begin
  insert into public.user_core_streaks (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_row from public.user_core_streaks where user_id = p_user_id for update;

  if v_row.streak_last_counted_date is null then
    update public.user_core_streaks
      set current_streak_days = 1, longest_streak_days = greatest(longest_streak_days, 1),
          streak_last_counted_date = v_today, last_activity_at = now(),
          last_activity_kind = p_kind, updated_at = now()
      where user_id = p_user_id;
  elsif v_row.streak_last_counted_date = v_today then
    -- Already counted today via this or another qualifying action — just
    -- record the latest activity, don't double-increment. This is exactly
    -- what makes the four actions alternatives rather than a daily
    -- checklist: whichever one happens first on a given day keeps the
    -- streak, and doing a second or third the same day is free.
    update public.user_core_streaks
      set last_activity_at = now(), last_activity_kind = p_kind, updated_at = now()
      where user_id = p_user_id;
  elsif v_row.streak_last_counted_date = v_today - 1 then
    update public.user_core_streaks
      set current_streak_days = current_streak_days + 1,
          longest_streak_days = greatest(longest_streak_days, current_streak_days + 1),
          streak_last_counted_date = v_today, last_activity_at = now(),
          last_activity_kind = p_kind, updated_at = now()
      where user_id = p_user_id;
  else
    -- Gap of 2+ days: streak resets to 1 (today).
    update public.user_core_streaks
      set current_streak_days = 1, streak_last_counted_date = v_today,
          last_activity_at = now(), last_activity_kind = p_kind, updated_at = now()
      where user_id = p_user_id;
  end if;
end;
$$;

comment on function public.bump_core_streak is
  'Idempotent per UTC day, regardless of which qualifying action triggers it — the four qualifying event triggers below all call this, so any one of them on a given day keeps the streak, by design (no "do all four daily" requirement). Increments if yesterday or today was already counted; resets to 1 on a gap of 2+ days.';

-- ---------------------------------------------------------------------------
-- 3. Qualifying event #1: application submitted
--    (saved_opportunities.status transitions TO 'applied' — not every save,
--    and not re-triggering on repeated updates that don't change status).
-- ---------------------------------------------------------------------------

create or replace function public.notify_core_streak_application_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'applied' and (tg_op = 'INSERT' or old.status is distinct from 'applied') then
    perform public.bump_core_streak(new.user_id, 'application_submitted');
  end if;
  return new;
end;
$$;

drop trigger if exists on_saved_opportunity_applied_streak on public.saved_opportunities;
create trigger on_saved_opportunity_applied_streak
after insert or update of status on public.saved_opportunities
for each row
execute function public.notify_core_streak_application_submitted();

-- ---------------------------------------------------------------------------
-- 4. Qualifying event #2: team join request sent.
-- ---------------------------------------------------------------------------

create or replace function public.notify_core_streak_join_request_sent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.bump_core_streak(new.requester_id, 'join_request_sent');
  return new;
end;
$$;

drop trigger if exists on_join_request_created_streak on public.join_requests;
create trigger on_join_request_created_streak
after insert on public.join_requests
for each row
execute function public.notify_core_streak_join_request_sent();

-- ---------------------------------------------------------------------------
-- 5. Qualifying event #3: meaningful CV update — generated_at changing on
--    an ALREADY-generated CV. First-time generation (null -> not null) is
--    deliberately excluded: that one-time action is already the "Preview
--    your starter CV" getting-started step, and counting it again here
--    would double-count a single action as if it were daily progress.
-- ---------------------------------------------------------------------------

create or replace function public.notify_core_streak_cv_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.generated_at is not null
     and new.generated_at is not null
     and new.generated_at is distinct from old.generated_at then
    perform public.bump_core_streak(new.user_id, 'cv_updated');
  end if;
  return new;
end;
$$;

drop trigger if exists on_cv_profile_updated_streak on public.cv_profiles;
create trigger on_cv_profile_updated_streak
after update of generated_at on public.cv_profiles
for each row
execute function public.notify_core_streak_cv_updated();

-- ---------------------------------------------------------------------------
-- 6. Qualifying event #4: idea posted.
-- ---------------------------------------------------------------------------

create or replace function public.notify_core_streak_idea_posted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.bump_core_streak(new.user_id, 'idea_posted');
  return new;
end;
$$;

drop trigger if exists on_idea_created_streak on public.ideas;
create trigger on_idea_created_streak
after insert on public.ideas
for each row
execute function public.notify_core_streak_idea_posted();
