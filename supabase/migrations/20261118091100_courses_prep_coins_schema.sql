-- Courses + Prep + Coins: replaces the old Skills feature (guided paths +
-- checkpoints) and the old external-link-only Courses page with two new
-- top-level Growth features, plus a new engagement-scoped coin currency.
--
-- Retirement note (confirmed against live data before writing this):
--   - public.skill_paths, public.skill_checkpoints, public.user_skill_paths,
--     public.user_checkpoint_progress, public.checkpoint_submissions,
--     public.portfolio_entries are all 0 rows live — dropped below.
--   - public.skill_resources (18 rows) and public.user_skill_resources
--     (1 row of real user completion data) are NOT dropped. They remain
--     exactly as-is and keep feeding user_skills.progress_percent via
--     src/lib/actions/skills.ts — that wiring is untouched. The new
--     /growth/courses page simply stops reading from them; no data is
--     lost. skill_resources rows are additionally backfilled into the
--     new public.courses table below (source = 'curated') so the existing
--     18 links keep showing up in the new UI too, with completion ported
--     into course_progress for the user who completed one.
--   - public.skills / public.user_skills (the flat tag catalog used by
--     CV/profile chips) are completely untouched by this migration.

-- ===========================================================================
-- PART 0: Drop the retired guided-Skills-paths feature (confirmed 0 rows).
-- ===========================================================================

-- Unschedule the nightly streak-risk-notification cron job BEFORE dropping
-- its target tables — confirmed live via `select * from cron.job` as
-- jobid 3 ("send-skill-streak-risk-notifications"), calling
-- send_skill_streak_risk_notifications(), which queries user_skill_paths
-- joined to skill_paths directly. Dropping those tables first would leave
-- a scheduled job erroring every night at 22:30 UTC indefinitely — table
-- DROP ... CASCADE does not touch pg_cron schedules.
select cron.unschedule(jobid) from cron.job where jobname = 'send-skill-streak-risk-notifications';

drop function if exists public.send_skill_streak_risk_notifications() cascade;
drop trigger if exists on_checkpoint_submission_streak on public.checkpoint_submissions;

-- These three functions reference skill_paths/skill_checkpoints/etc. in
-- their bodies (confirmed live via pg_proc.prosrc), but a plain body
-- reference is not a tracked dependency in Postgres — CASCADE on the
-- table drops below would NOT remove them, leaving dead/broken RPCs
-- still callable by any stale client code. Drop them explicitly first.
drop function if exists public.bump_skill_path_streak(p_user_id uuid, p_path_id uuid) cascade;
drop function if exists public.complete_skill_checkpoint(
  p_submission_id uuid, p_status text, p_portfolio_title text,
  p_portfolio_description text, p_portfolio_project_url text,
  p_portfolio_tags text[], p_add_to_portfolio boolean
) cascade;
drop function if exists public.enroll_in_skill_path(p_path_id uuid) cascade;

drop table if exists public.checkpoint_submissions cascade;
drop table if exists public.user_checkpoint_progress cascade;
drop table if exists public.portfolio_entries cascade;
drop table if exists public.user_skill_paths cascade;
drop table if exists public.skill_checkpoints cascade;
drop table if exists public.skill_paths cascade;

-- Any admin-importer tooling / scheduled jobs tied to skill_paths (e.g. the
-- streak-risk notification cron from 20261027073437) are dropped by the
-- cascades above where they referenced these tables directly. The admin
-- import UI at src/app/admin/skills/* is deleted in the app-code phase —
-- not here, this migration only touches the database.

-- ===========================================================================
-- PART 1: Courses (API-sourced, flowable or PDF-fallback reader)
-- ===========================================================================

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  -- 'doab' | 'open_textbook_library' | 'curated' (curated = ported from the
  -- old skill_resources external-link rows, or future hand-added items).
  source text not null check (source in ('doab', 'open_textbook_library', 'curated')),
  -- Stable per-source external id for upsert dedup on re-ingestion. NULL
  -- only for 'curated' rows with no external source.
  source_ref text,
  title text not null check (char_length(title) <= 300),
  author text,
  summary text,
  -- Free-text category/field label shown as the card subtitle group
  -- (e.g. "Web Dev", "Business"), independent from the Prep field taxonomy
  -- below — a course isn't required to map 1:1 onto a Prep field.
  category text not null default 'general',
  license text,
  source_url text,
  -- Direct link to the original PDF, when one exists (DOAB/OTL items;
  -- curated items may have no PDF at all and rely on external_url only).
  pdf_url text,
  -- Populated by the ingestion pipeline once extraction has been attempted.
  -- 'pending' until the ingest worker processes this row.
  reader_mode text not null default 'pending' check (
    reader_mode in ('pending', 'flowable', 'pdf_fallback', 'external_link')
  ),
  -- Extracted, cleaned text for the flowable reader. Null for pdf_fallback /
  -- external_link rows. Stored as plain structured text (paragraph breaks
  -- preserved), never rewritten/editorialized — presented honestly as the
  -- source content, per spec.
  flowable_content text,
  -- External link fallback for curated rows with no fetchable PDF at all
  -- (mirrors the old skill_resources.url behavior).
  external_url text,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  is_coin_gated boolean not null default false,
  -- Flat per spec — always 25 when gated — but stored per-row rather than
  -- hardcoded in app code, so a future change doesn't need a migration.
  unlock_cost integer not null default 25 check (unlock_cost >= 0),
  is_published boolean not null default true,
  ingested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.courses is
  'Replaces skill_resources as the source for /growth/courses. Content is sourced from external open-access APIs (DOAB, Open Textbook Library) or ported from the old curated skill_resources rows — never authored/rewritten by the app. reader_mode decides whether the in-app flowable reader or a plain embedded PDF viewer is used.';
comment on column public.courses.reader_mode is
  'pending = not yet processed by the ingest worker. flowable = flowable_content was extracted cleanly and the custom reader (theme/font/size, reflow) is used. pdf_fallback = extraction was unreliable (scanned/heavy multi-column) and the plain embedded PDF viewer is used against pdf_url instead. external_link = no fetchable file at all (curated link-out row).';
comment on column public.courses.is_coin_gated is
  'Most rows should be false (free) — this is an engagement mechanic, not a monetization gate. See public.user_coins / unlock_attempts.';

create unique index courses_source_ref_unique_idx
  on public.courses (source, source_ref)
  where source_ref is not null;
create index courses_category_idx on public.courses (category);
create index courses_published_idx on public.courses (is_published) where is_published;
create index courses_reader_mode_idx on public.courses (reader_mode);

alter table public.courses enable row level security;

create policy courses_public_read on public.courses
  for select to authenticated, anon
  using (is_published);

-- 1b. Per-user unlock state + reading progress.
create table public.course_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  is_unlocked boolean not null default true, -- true immediately for free courses
  unlocked_at timestamptz,
  -- 0-100, last reading position as a percentage through flowable_content
  -- (or page fraction for pdf_fallback). Null until first opened.
  progress_percent smallint check (progress_percent is null or (progress_percent between 0 and 100)),
  completed_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

comment on table public.course_progress is
  'One row per user per course they have opened or unlocked. is_unlocked is true by default for free courses (set at insert time by app code) and only meaningfully false for a gated course the user has not yet spent coins on.';

alter table public.course_progress enable row level security;

create policy course_progress_owner_all on public.course_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 1c. Unlock attempt log — logs every attempt (successful or not), per
-- spec section 4, so a future willingness-to-pay signal can be derived
-- from how often users hit a locked item without enough coins, without
-- needing a schema change later to start capturing it.
create table public.unlock_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- What was being unlocked. Exactly one of course_id / prep_item_id is set,
  -- enforced below — "prep item" is reserved for a future per-item gate
  -- inside a Prep field; nothing in Phase 1 sets prep_item_id yet, but the
  -- column exists now so Prep gating doesn't need another migration.
  course_id uuid references public.courses(id) on delete cascade,
  prep_item_id uuid,
  coin_balance_at_attempt integer not null,
  cost integer not null,
  succeeded boolean not null,
  created_at timestamptz not null default now(),
  constraint unlock_attempts_exactly_one_target check (
    (course_id is not null)::int + (prep_item_id is not null)::int = 1
  )
);

comment on table public.unlock_attempts is
  'Logs every unlock attempt, successful or not (insufficient balance). Deliberately not just "successful unlocks" — per product spec this is the raw material for a future willingness-to-pay signal (how often users hit a locked item and cannot afford it). No reporting is built on this yet.';

alter table public.unlock_attempts enable row level security;

create policy unlock_attempts_owner_all on public.unlock_attempts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ===========================================================================
-- PART 2: Prep (field-based interview-readiness quizzes)
-- ===========================================================================

create table public.prep_fields (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) <= 100),
  description text,
  icon text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.prep_fields is
  'Configurable fields/categories for Prep (e.g. "Web Dev", "AI Engineering", "UI/UX Design") — not hardcoded in app code. New fields are added here, not via a code change.';

create index prep_fields_published_idx on public.prep_fields (is_published) where is_published;

alter table public.prep_fields enable row level security;

create policy prep_fields_public_read on public.prep_fields
  for select to authenticated, anon
  using (is_published);

create table public.prep_questions (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.prep_fields(id) on delete cascade,
  prompt text not null,
  -- Exactly 4 options, stored as a jsonb array of strings — kept simple
  -- (no separate options table) since Prep questions are not tied to any
  -- editable course content and don't need per-option metadata.
  options jsonb not null,
  correct_option_index smallint not null check (correct_option_index between 0 and 3),
  explanation text,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  is_coin_gated boolean not null default false,
  unlock_cost integer not null default 25 check (unlock_cost >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint prep_questions_options_shape check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4)
);

comment on table public.prep_questions is
  'Field-general interview-readiness questions. Explicitly NOT tied to any course/PDF — a user picks a field and gets questions for that field generally, not "finish this course to unlock its quiz" (that pattern is retired along with skill_checkpoints).';

create index prep_questions_field_idx on public.prep_questions (field_id);
create index prep_questions_published_idx on public.prep_questions (is_published) where is_published;

alter table public.prep_questions enable row level security;

-- Note: correct_option_index must not be selectable by normal authenticated
-- clients before an attempt is graded, to prevent trivially reading the
-- answer key. A public_prep_questions view (below) is what app code reads
-- for display; the base table itself is service-role / grading-function
-- only for the correct_option_index column.
revoke select on public.prep_questions from authenticated, anon;

create view public.prep_questions_public
  with (security_invoker = true) as
select id, field_id, prompt, options, explanation, difficulty, is_coin_gated, unlock_cost, is_published, created_at
from public.prep_questions
where is_published;

comment on view public.prep_questions_public is
  'Answer-key-free projection of prep_questions for client display. explanation is still included — it is shown only after an attempt is graded by grade_prep_attempt(), never alongside the unanswered question, which app code enforces by not fetching it until after submission.';

grant select on public.prep_questions_public to authenticated, anon;

create table public.prep_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  field_id uuid not null references public.prep_fields(id) on delete cascade,
  -- Snapshot of the question set presented, so a later change to
  -- prep_questions doesn't retroactively alter a past attempt's record.
  question_ids uuid[] not null,
  answers jsonb not null, -- { "<question_id>": <selected_option_index> }
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0),
  coins_awarded integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table public.prep_attempts is
  'One row per completed Prep quiz attempt — the "discrete, trackable event" the coin-awarding spec calls for. coins_awarded records what bump_prep_coins actually granted for this attempt (idempotency guard lives in that function, not here).';

create index prep_attempts_user_idx on public.prep_attempts (user_id);
create index prep_attempts_field_idx on public.prep_attempts (field_id);

alter table public.prep_attempts enable row level security;

create policy prep_attempts_owner_all on public.prep_attempts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ===========================================================================
-- PART 3: Coins (Courses/Prep-scoped currency — additive, not a replacement
-- for public.user_core_streaks, which is left completely untouched).
-- ===========================================================================

create table public.user_coins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  last_daily_checkin_date date,
  updated_at timestamptz not null default now()
);

comment on table public.user_coins is
  'One row per user: current coin balance for the Courses/Prep engagement mechanic. Scoped to Courses/Prep only for now, per spec — no app-wide paywall. Never goes negative (enforced by the check constraint; spend functions below re-check balance before debiting).';

alter table public.user_coins enable row level security;

create policy user_coins_owner_all on public.user_coins
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null, -- positive = earn, negative = spend
  reason text not null check (reason in ('daily_checkin', 'prep_quiz_completed', 'course_unlock', 'prep_unlock')),
  -- Polymorphic reference to what this transaction concerns, for the
  -- future willingness-to-pay analysis (see unlock_attempts comment) and
  -- for an eventual "transaction history" UI. Exactly one set, or neither
  -- for daily_checkin, which has no target row.
  course_id uuid references public.courses(id) on delete set null,
  prep_attempt_id uuid references public.prep_attempts(id) on delete set null,
  balance_after integer not null check (balance_after >= 0),
  created_at timestamptz not null default now()
);

comment on table public.coin_transactions is
  'Append-only ledger of every coin earn/spend. This is the data source for the future willingness-to-pay signal described in the product spec — never delete or rewrite rows here, only insert.';

create index coin_transactions_user_idx on public.coin_transactions (user_id, created_at desc);

alter table public.coin_transactions enable row level security;

create policy coin_transactions_owner_read on public.coin_transactions
  for select to authenticated
  using (user_id = auth.uid());
-- Deliberately no insert/update/delete policy for authenticated — all
-- writes happen through the security-definer functions below, never
-- directly from the client.

-- ---------------------------------------------------------------------------
-- 3a. Daily check-in: +1 coin for opening the app that day. Idempotent per
-- UTC day, same shape as bump_core_streak's day-guard logic.
-- ---------------------------------------------------------------------------

create or replace function public.award_daily_checkin_coin()
returns table (balance integer, awarded boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_user_id uuid := auth.uid();
  v_row public.user_coins%rowtype;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.user_coins (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select * into v_row from public.user_coins where user_id = v_user_id for update;

  if v_row.last_daily_checkin_date is not null and v_row.last_daily_checkin_date = v_today then
    return query select v_row.balance, false;
    return;
  end if;

  update public.user_coins
    set balance = balance + 1, last_daily_checkin_date = v_today, updated_at = now()
    where user_id = v_user_id
    returning public.user_coins.balance into v_row.balance;

  insert into public.coin_transactions (user_id, amount, reason, balance_after)
  values (v_user_id, 1, 'daily_checkin', v_row.balance);

  return query select v_row.balance, true;
end;
$$;

comment on function public.award_daily_checkin_coin is
  'Call once per app session (e.g. from AppShell on mount) for the signed-in user. Idempotent per UTC day — the second call on the same day returns the current balance with awarded=false rather than granting a second coin.';

revoke all on function public.award_daily_checkin_coin() from public;
grant execute on function public.award_daily_checkin_coin() to authenticated;

-- ---------------------------------------------------------------------------
-- 3b. Prep quiz completion: +10 coins, via grade_prep_attempt (see below —
-- grading and the coin award happen in the same function so a client can
-- never submit a pre-computed score and claim a reward for it).
-- ---------------------------------------------------------------------------

create or replace function public.grade_prep_attempt(
  p_field_id uuid,
  p_question_ids uuid[],
  p_answers jsonb -- { "<question_id>": <selected_option_index> }
)
returns table (attempt_id uuid, score integer, total integer, coins_awarded integer, new_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_score integer := 0;
  v_total integer;
  v_attempt_id uuid;
  v_coins integer := 0;
  v_balance integer;
  q record;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_question_ids is null or array_length(p_question_ids, 1) is null then
    raise exception 'question_ids must not be empty';
  end if;

  v_total := array_length(p_question_ids, 1);

  -- Grade server-side against the real answer key — correct_option_index
  -- is never sent to the client, so this is the only place a score can
  -- be computed, closing off a client-submitted-score exploit.
  for q in
    select id, correct_option_index
    from public.prep_questions
    where id = any(p_question_ids)
  loop
    if (p_answers ->> q.id::text)::int = q.correct_option_index then
      v_score := v_score + 1;
    end if;
  end loop;

  insert into public.prep_attempts (user_id, field_id, question_ids, answers, score, total, completed_at)
  values (v_user_id, p_field_id, p_question_ids, p_answers, v_score, v_total, now())
  returning id into v_attempt_id;

  -- +10 coins for completing a quiz, per spec — a discrete, trackable
  -- event. Awarded once per attempt (attempts are always new rows, so no
  -- extra idempotency guard is needed beyond "one attempt = one award").
  v_coins := 10;

  insert into public.user_coins (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  update public.user_coins
    set balance = balance + v_coins, updated_at = now()
    where user_id = v_user_id
    returning public.user_coins.balance into v_balance;

  update public.prep_attempts set coins_awarded = v_coins where id = v_attempt_id;

  insert into public.coin_transactions (user_id, amount, reason, prep_attempt_id, balance_after)
  values (v_user_id, v_coins, 'prep_quiz_completed', v_attempt_id, v_balance);

  return query select v_attempt_id, v_score, v_total, v_coins, v_balance;
end;
$$;

comment on function public.grade_prep_attempt is
  'Grades a Prep quiz attempt server-side (the client never sees correct_option_index) and awards the flat +10 coins for completing it. Returns the score so the UI can show results immediately.';

revoke all on function public.grade_prep_attempt(uuid, uuid[], jsonb) from public;
grant execute on function public.grade_prep_attempt(uuid, uuid[], jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 3c. Unlocking a gated course: flat 25-coin cost, logs every attempt
-- (success or failure) to unlock_attempts per spec section 4.
-- ---------------------------------------------------------------------------

create or replace function public.unlock_course(p_course_id uuid)
returns table (success boolean, new_balance integer, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cost integer;
  v_gated boolean;
  v_balance integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select unlock_cost, is_coin_gated into v_cost, v_gated
  from public.courses where id = p_course_id;

  if v_cost is null then
    return query select false, 0, 'course_not_found';
    return;
  end if;

  insert into public.user_coins (user_id) values (v_user_id) on conflict (user_id) do nothing;
  select balance into v_balance from public.user_coins where user_id = v_user_id for update;

  if not v_gated then
    -- Nothing to spend — this path exists so the UI can call the same
    -- function unconditionally and let the backend decide.
    insert into public.course_progress (user_id, course_id, is_unlocked, unlocked_at)
    values (v_user_id, p_course_id, true, now())
    on conflict (user_id, course_id) do update set is_unlocked = true, unlocked_at = coalesce(public.course_progress.unlocked_at, now());

    insert into public.unlock_attempts (user_id, course_id, coin_balance_at_attempt, cost, succeeded)
    values (v_user_id, p_course_id, v_balance, 0, true);

    return query select true, v_balance, 'free';
    return;
  end if;

  if v_balance < v_cost then
    insert into public.unlock_attempts (user_id, course_id, coin_balance_at_attempt, cost, succeeded)
    values (v_user_id, p_course_id, v_balance, v_cost, false);

    return query select false, v_balance, 'insufficient_balance';
    return;
  end if;

  update public.user_coins set balance = balance - v_cost, updated_at = now()
    where user_id = v_user_id
    returning public.user_coins.balance into v_balance;

  insert into public.course_progress (user_id, course_id, is_unlocked, unlocked_at)
  values (v_user_id, p_course_id, true, now())
  on conflict (user_id, course_id) do update set is_unlocked = true, unlocked_at = now();

  insert into public.coin_transactions (user_id, amount, reason, course_id, balance_after)
  values (v_user_id, -v_cost, 'course_unlock', p_course_id, v_balance);

  insert into public.unlock_attempts (user_id, course_id, coin_balance_at_attempt, cost, succeeded)
  values (v_user_id, p_course_id, v_balance + v_cost, v_cost, true);

  return query select true, v_balance, 'unlocked';
end;
$$;

comment on function public.unlock_course is
  'Spends unlock_cost coins to unlock a gated course for the current user, or no-ops successfully for a free course. Every call is logged to unlock_attempts regardless of outcome, including insufficient-balance failures, per the product spec''s future willingness-to-pay tracking requirement.';

revoke all on function public.unlock_course(uuid) from public;
grant execute on function public.unlock_course(uuid) to authenticated;

-- ===========================================================================
-- PART 4: Backfill the 18 existing curated skill_resources rows into the
-- new courses table, and port the 1 existing completion row, so nothing
-- a user already interacted with disappears from their view.
-- ===========================================================================

insert into public.courses (source, title, author, summary, category, external_url, is_coin_gated, unlock_cost, is_published, reader_mode, created_at)
select
  'curated',
  sr.title,
  sr.provider,
  null,
  coalesce(s.category, 'general'),
  sr.url,
  false, -- the old catalog had no coin-gating concept; port everything as free
  0,
  true,
  'external_link',
  sr.created_at
from public.skill_resources sr
left join public.skills s on s.id = sr.skill_id;

-- Port the single existing completion (user_skill_resources) across to
-- course_progress, matched by the external url we just copied in, so the
-- one user who completed something doesn't lose that record in the new UI.
insert into public.course_progress (user_id, course_id, is_unlocked, completed_at, last_opened_at, created_at)
select usr.user_id, c.id, true, usr.completed_at, usr.completed_at, usr.completed_at
from public.user_skill_resources usr
join public.skill_resources sr on sr.id = usr.resource_id
join public.courses c on c.external_url = sr.url and c.source = 'curated'
on conflict (user_id, course_id) do nothing;
