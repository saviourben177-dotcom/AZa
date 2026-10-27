-- Skills feature v2: guided learning paths, checkpoints, submission-based
-- evaluation, portfolio artifacts, and streak/retention tracking.
--
-- Additive only. Does not touch the existing public.skills /
-- public.skill_resources / public.user_skills / public.user_skill_resources
-- tables, which remain exactly as-is (the simple skill-tag + external
-- resource catalog used elsewhere, e.g. CV skills chips). This feature is a
-- parallel, richer system scoped to src/app/growth/skills/paths and reachable
-- from the existing Skills page without altering it.
--
-- No payment/unlock gateway is implemented here — skill_paths.tier exists
-- so the UI can show a locked badge for premium content, but no purchase
-- flow is wired to it (explicitly out of scope per spec).

-- ---------------------------------------------------------------------------
-- 1. Learning paths (the top-level "Web Development", "Copywriting", etc.)
-- ---------------------------------------------------------------------------

create table public.skill_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) <= 150),
  category text not null,
  summary text check (summary is null or char_length(summary) <= 500),
  description text,
  cover_icon text,
  -- Does finishing this path culminate in a visual/showable artifact
  -- (e.g. Web Development -> a built project) vs. evidence of capability
  -- without a visual deliverable (e.g. Client Acquisition)? Drives whether
  -- the final checkpoint's submission becomes a portfolio_entries row with
  -- a project (vs. a capability-evidence row with no preview).
  output_kind text not null default 'artifact' check (output_kind in ('artifact', 'capability')),
  tier text not null default 'free' check (tier in ('free', 'premium')),
  estimated_weeks smallint check (estimated_weeks is null or estimated_weeks > 0),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.skill_paths is
  'A guided, categorized learning path (e.g. "Web Development", "Copywriting"). Top level of the Skills feature. Independent of public.skills (the flat skill-tag catalog used by CV/profile chips).';
comment on column public.skill_paths.output_kind is
  'artifact = completing the path produces a showable portfolio project (e.g. Web Development). capability = completion is evidence of capability without a visual deliverable (e.g. Client Acquisition), same evaluation system, different output type.';
comment on column public.skill_paths.tier is
  'free | premium. UI must show a locked state for premium paths when the user has no entitlement. No purchase flow is implemented by this migration — payment is explicitly deferred.';

create index skill_paths_category_idx on public.skill_paths(category);
create index skill_paths_published_idx on public.skill_paths(is_published) where is_published;

-- ---------------------------------------------------------------------------
-- 2. Checkpoints (sequential steps within a path, locked until prior ones
--    are passed)
-- ---------------------------------------------------------------------------

create table public.skill_checkpoints (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.skill_paths(id) on delete cascade,
  "order" smallint not null check ("order" >= 1),
  title text not null check (char_length(title) <= 150),
  description text,
  -- What the checkpoint teaches, rendered as the "What you'll learn" checklist.
  learning_points text[] not null default '{}',
  -- How content is framed for this checkpoint per learning style. Each key
  -- (entertaining | focused | practical) maps to markdown body content, so
  -- the same checkpoint visibly changes presentation per the user's chosen
  -- style rather than only storing the preference inertly.
  content_by_style jsonb not null default '{}'::jsonb,
  is_final boolean not null default false,
  requires_submission boolean not null default true,
  -- Evaluation rubric handed to the AI grader for this checkpoint's
  -- submissions. Plain text criteria, never auto-pass.
  evaluation_criteria text,
  created_at timestamptz not null default now(),
  unique (path_id, "order")
);

comment on table public.skill_checkpoints is
  'A sequential step within a skill_paths path. Checkpoint N+1 is locked in the UI until checkpoint N has a passed submission (see user_checkpoint_progress). The final checkpoint (is_final) for an artifact-output path is the "Build a Real Project" step that produces a portfolio_entries row on pass.';
comment on column public.skill_checkpoints.content_by_style is
  'JSON object keyed by learning style (entertaining/focused/practical), each value the markdown body to render for that style. Missing keys fall back to the "focused" style in the UI.';

create index skill_checkpoints_path_order_idx on public.skill_checkpoints(path_id, "order");

-- ---------------------------------------------------------------------------
-- 3. Per-user path enrollment + learning style choice + streak/consistency
-- ---------------------------------------------------------------------------

create table public.user_skill_paths (
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id uuid not null references public.skill_paths(id) on delete cascade,
  learning_style text check (learning_style in ('entertaining', 'focused', 'practical')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_activity_at timestamptz not null default now(),
  -- Daily streak, Duolingo-style: count of consecutive UTC days with at
  -- least one checkpoint-advancing or submission activity on this path.
  current_streak_days integer not null default 0,
  longest_streak_days integer not null default 0,
  streak_last_counted_date date,
  -- Distinct UTC days with any recorded activity since started_at, used
  -- (alongside elapsed calendar days) to compute the Consistency rating on
  -- completion — actual pacing/return behavior, not just the final result.
  active_days_count integer not null default 0,
  -- Ratings shown on path completion. Populated by complete_skill_checkpoint()
  -- when the final checkpoint is passed; null until then.
  rating_overall smallint check (rating_overall is null or (rating_overall between 1 and 5)),
  rating_speed smallint check (rating_speed is null or (rating_speed between 1 and 5)),
  rating_consistency smallint check (rating_consistency is null or (rating_consistency between 1 and 5)),
  primary key (user_id, path_id)
);

comment on table public.user_skill_paths is
  'One row per user per enrolled skill_paths path. Holds the learning-style choice (which must visibly change checkpoint content, not just sit stored), streak counters, and the three completion ratings (Overall/Speed/Consistency).';
comment on column public.user_skill_paths.rating_consistency is
  'Reflects actual pacing/return behavior over the path duration (active_days_count vs elapsed calendar days, streak behavior) — not derived from the final result alone.';

create index user_skill_paths_user_idx on public.user_skill_paths(user_id);
create index user_skill_paths_streak_idx on public.user_skill_paths(user_id, current_streak_days) where status = 'in_progress';

-- ---------------------------------------------------------------------------
-- 4. Per-user checkpoint progress (locked / in_progress / completed)
-- ---------------------------------------------------------------------------

create table public.user_checkpoint_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkpoint_id uuid not null references public.skill_checkpoints(id) on delete cascade,
  path_id uuid not null references public.skill_paths(id) on delete cascade,
  status text not null default 'locked' check (status in ('locked', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  primary key (user_id, checkpoint_id)
);

comment on table public.user_checkpoint_progress is
  'Per-user, per-checkpoint state. locked = prior checkpoint not yet passed. in_progress = unlocked, no passed submission yet. completed = has a passed submission (or, for a no-submission checkpoint, was explicitly marked done). Row is created (as locked, or in_progress for checkpoint 1) when the user enrolls via user_skill_paths.';

create index user_checkpoint_progress_path_idx on public.user_checkpoint_progress(user_id, path_id);

-- ---------------------------------------------------------------------------
-- 5. Submissions + AI evaluation
-- ---------------------------------------------------------------------------

create table public.checkpoint_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkpoint_id uuid not null references public.skill_checkpoints(id) on delete cascade,
  path_id uuid not null references public.skill_paths(id) on delete cascade,
  -- What the user submitted: free text, a link (repo/deployed project/doc),
  -- or both. At least one is required — enforced by the app, not a DB
  -- constraint, since valid combinations vary by checkpoint type.
  submission_text text,
  submission_url text,
  status text not null default 'pending' check (status in ('pending', 'passed', 'failed')),
  -- AI evaluation output. feedback must give honest, specific reasons —
  -- never a generic "nice work" on a fail, and never "passed" when it
  -- didn't (see complete_skill_checkpoint and the grading prompt in
  -- src/lib/groq.ts / evaluateCheckpointSubmission).
  ai_feedback text,
  ai_strengths text[] not null default '{}',
  ai_gaps text[] not null default '{}',
  evaluated_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.checkpoint_submissions is
  'A user''s submission for a checkpoint that requires one, plus the AI evaluation result. Multiple attempts per checkpoint are allowed (resubmission after a fail) — all attempts are kept for history; the latest "passed" row is what unlocks the next checkpoint.';
comment on column public.checkpoint_submissions.status is
  'pending = submitted, evaluation in flight or not yet run. passed/failed = AI evaluation result. The UI and AI must never present a pending or failed submission as passed.';

create index checkpoint_submissions_user_checkpoint_idx on public.checkpoint_submissions(user_id, checkpoint_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. Portfolio entries (the culminating artifact / capability evidence)
-- ---------------------------------------------------------------------------

create table public.portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id uuid not null references public.skill_paths(id) on delete cascade,
  submission_id uuid references public.checkpoint_submissions(id) on delete set null,
  title text not null check (char_length(title) <= 150),
  description text,
  -- For output_kind = 'artifact' paths: a link to the showable thing
  -- (deployed project, repo, design file, doc). Null for output_kind =
  -- 'capability' paths, which have no visual deliverable by design.
  project_url text,
  tags text[] not null default '{}',
  -- Verified = produced by passing the path's final checkpoint evaluation,
  -- as opposed to any future manually-added entry. Every row created by
  -- complete_skill_checkpoint() is verified; there is currently no other
  -- insertion path, but the column keeps the distinction explicit in the UI.
  verified boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.portfolio_entries is
  'A completed, verified piece of evidence on the user''s profile, created when a skill_paths final checkpoint is passed. For output_kind=artifact paths this is a showable project (project_url set); for output_kind=capability paths it is evidence of capability with no visual deliverable (project_url null) — same system, different output type per spec.';

create index portfolio_entries_user_idx on public.portfolio_entries(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.skill_paths enable row level security;
alter table public.skill_checkpoints enable row level security;
alter table public.user_skill_paths enable row level security;
alter table public.user_checkpoint_progress enable row level security;
alter table public.checkpoint_submissions enable row level security;
alter table public.portfolio_entries enable row level security;

-- Catalog tables: published content is readable by any authenticated user.
-- Writes are curator/admin only, matching the pattern used by
-- opportunities/businesses/learning_articles elsewhere in this schema.
create policy skill_paths_select_published on public.skill_paths
  for select to authenticated
  using (is_published or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('curator', 'admin')
  ));

create policy skill_paths_write_curator on public.skill_paths
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('curator', 'admin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('curator', 'admin')));

create policy skill_checkpoints_select on public.skill_checkpoints
  for select to authenticated
  using (exists (
    select 1 from public.skill_paths sp
    where sp.id = path_id and (sp.is_published or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('curator', 'admin')
    ))
  ));

create policy skill_checkpoints_write_curator on public.skill_checkpoints
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('curator', 'admin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('curator', 'admin')));

-- Per-user tables: owner-only read/write.
create policy user_skill_paths_own on public.user_skill_paths
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_checkpoint_progress_own on public.user_checkpoint_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy checkpoint_submissions_own on public.checkpoint_submissions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Portfolio: owner can do everything; any authenticated user can view a
-- public profile's entries (profile pages already gate on profiles.is_public
-- via public_profiles — mirror that here for consistency).
create policy portfolio_entries_owner_all on public.portfolio_entries
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy portfolio_entries_select_public on public.portfolio_entries
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public)
  );

-- ---------------------------------------------------------------------------
-- Enrollment: create user_skill_paths + seed locked/in_progress checkpoint
-- rows in one call (keeps page.tsx / server actions simple and atomic).
-- ---------------------------------------------------------------------------

create or replace function public.enroll_in_skill_path(p_path_id uuid, p_learning_style text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_first_checkpoint_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_skill_paths (user_id, path_id, learning_style)
  values (v_user_id, p_path_id, p_learning_style)
  on conflict (user_id, path_id) do update
    set learning_style = coalesce(excluded.learning_style, public.user_skill_paths.learning_style);

  -- Seed one progress row per checkpoint: first checkpoint unlocked, rest locked.
  insert into public.user_checkpoint_progress (user_id, checkpoint_id, path_id, status, started_at)
  select
    v_user_id,
    c.id,
    c.path_id,
    case when c."order" = 1 then 'in_progress' else 'locked' end,
    case when c."order" = 1 then now() else null end
  from public.skill_checkpoints c
  where c.path_id = p_path_id
  on conflict (user_id, checkpoint_id) do nothing;
end;
$$;

comment on function public.enroll_in_skill_path is
  'Enrolls the current user in a path: upserts user_skill_paths and seeds user_checkpoint_progress rows (checkpoint 1 unlocked, rest locked). Idempotent — safe to call again to change learning_style.';

-- ---------------------------------------------------------------------------
-- Streak bump: call once per day a user does path-advancing activity.
-- ---------------------------------------------------------------------------

create or replace function public.bump_skill_path_streak(p_user_id uuid, p_path_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_row public.user_skill_paths%rowtype;
begin
  select * into v_row from public.user_skill_paths where user_id = p_user_id and path_id = p_path_id for update;
  if not found then
    return;
  end if;

  if v_row.streak_last_counted_date is null then
    update public.user_skill_paths
      set current_streak_days = 1, longest_streak_days = greatest(longest_streak_days, 1),
          streak_last_counted_date = v_today, active_days_count = active_days_count + 1,
          last_activity_at = now()
      where user_id = p_user_id and path_id = p_path_id;
  elsif v_row.streak_last_counted_date = v_today then
    update public.user_skill_paths set last_activity_at = now() where user_id = p_user_id and path_id = p_path_id;
  elsif v_row.streak_last_counted_date = v_today - 1 then
    update public.user_skill_paths
      set current_streak_days = current_streak_days + 1,
          longest_streak_days = greatest(longest_streak_days, current_streak_days + 1),
          streak_last_counted_date = v_today, active_days_count = active_days_count + 1,
          last_activity_at = now()
      where user_id = p_user_id and path_id = p_path_id;
  else
    -- Gap of 2+ days: streak resets to 1 (today).
    update public.user_skill_paths
      set current_streak_days = 1, streak_last_counted_date = v_today,
          active_days_count = active_days_count + 1, last_activity_at = now()
      where user_id = p_user_id and path_id = p_path_id;
  end if;
end;
$$;

comment on function public.bump_skill_path_streak is
  'Idempotent per UTC day. Call whenever a user does checkpoint-advancing activity on a path (submission created, checkpoint started). Increments current_streak_days if yesterday or today was already counted; resets to 1 on a gap.';

-- ---------------------------------------------------------------------------
-- Checkpoint completion: records a passed/failed submission result,
-- unlocks the next checkpoint on pass, and on the final checkpoint's pass
-- writes the completion ratings + a portfolio_entries row.
-- Never called with status='passed' unless the AI evaluation actually
-- passed the submission — enforced at the call site (server action), this
-- function only persists the already-decided result honestly.
-- ---------------------------------------------------------------------------

create or replace function public.complete_skill_checkpoint(
  p_submission_id uuid,
  p_status text, -- 'passed' | 'failed'
  p_portfolio_title text default null,
  p_portfolio_description text default null,
  p_portfolio_project_url text default null,
  p_portfolio_tags text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_sub public.checkpoint_submissions%rowtype;
  v_checkpoint public.skill_checkpoints%rowtype;
  v_next_checkpoint public.skill_checkpoints%rowtype;
  v_path public.skill_paths%rowtype;
  v_elapsed_days numeric;
  v_active_days integer;
  v_pace_ratio numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_status not in ('passed', 'failed') then
    raise exception 'Invalid status: %', p_status;
  end if;

  select * into v_sub from public.checkpoint_submissions where id = p_submission_id and user_id = v_user_id;
  if not found then
    raise exception 'Submission not found';
  end if;

  update public.checkpoint_submissions set status = p_status, evaluated_at = now() where id = p_submission_id;

  select * into v_checkpoint from public.skill_checkpoints where id = v_sub.checkpoint_id;
  select * into v_path from public.skill_paths where id = v_checkpoint.path_id;

  perform public.bump_skill_path_streak(v_user_id, v_checkpoint.path_id);

  if p_status <> 'passed' then
    return;
  end if;

  update public.user_checkpoint_progress
    set status = 'completed', completed_at = now()
    where user_id = v_user_id and checkpoint_id = v_checkpoint.id;

  if v_checkpoint.is_final then
    select p.* into v_path from public.skill_paths p where p.id = v_checkpoint.path_id;

    select
      extract(epoch from (now() - usp.started_at)) / 86400.0,
      usp.active_days_count
    into v_elapsed_days, v_active_days
    from public.user_skill_paths usp
    where usp.user_id = v_user_id and usp.path_id = v_checkpoint.path_id;

    v_elapsed_days := greatest(coalesce(v_elapsed_days, 1), 1);
    v_pace_ratio := coalesce(v_active_days, 0)::numeric / v_elapsed_days;

    update public.user_skill_paths
      set status = 'completed',
          completed_at = now(),
          rating_overall = 5,
          rating_speed = case
            when v_elapsed_days <= coalesce(v_path.estimated_weeks, 4) * 7 then 5
            when v_elapsed_days <= coalesce(v_path.estimated_weeks, 4) * 14 then 3
            else 2
          end,
          -- Consistency reflects actual return behavior: how large a share of
          -- the elapsed days had real activity, not just that the user
          -- eventually finished.
          rating_consistency = case
            when v_pace_ratio >= 0.5 then 5
            when v_pace_ratio >= 0.25 then 4
            when v_pace_ratio >= 0.1 then 3
            else 2
          end
      where user_id = v_user_id and path_id = v_checkpoint.path_id;

    insert into public.portfolio_entries (user_id, path_id, submission_id, title, description, project_url, tags, verified)
    values (
      v_user_id,
      v_checkpoint.path_id,
      p_submission_id,
      coalesce(p_portfolio_title, v_path.title),
      p_portfolio_description,
      case when v_path.output_kind = 'artifact' then p_portfolio_project_url else null end,
      p_portfolio_tags,
      true
    );
  else
    select * into v_next_checkpoint
    from public.skill_checkpoints
    where path_id = v_checkpoint.path_id and "order" = v_checkpoint."order" + 1;

    if found then
      update public.user_checkpoint_progress
        set status = 'in_progress', started_at = now()
        where user_id = v_user_id and checkpoint_id = v_next_checkpoint.id and status = 'locked';
    end if;
  end if;
end;
$$;

comment on function public.complete_skill_checkpoint is
  'Persists an already-decided pass/fail result for a submission (the AI evaluation call happens before this, in the server action — this function never itself decides pass/fail). On pass: marks the checkpoint complete, unlocks the next one, bumps the streak, and — if this was the final checkpoint — writes the three completion ratings and a portfolio_entries row.';

-- ---------------------------------------------------------------------------
-- Streak-risk nudge: find users whose streak will lapse at UTC midnight
-- with no activity today, and notify them. Scheduled externally (pg_cron or
-- an Edge Function invocation) the same way send_opportunity_match_notifications
-- is scheduled — this migration only defines the function.
-- ---------------------------------------------------------------------------

create or replace function public.send_skill_streak_risk_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  rec record;
begin
  if not pg_try_advisory_xact_lock(hashtext('send_skill_streak_risk_notifications')) then
    return;
  end if;

  for rec in
    select usp.user_id, usp.path_id, sp.title as path_title, usp.current_streak_days
    from public.user_skill_paths usp
    join public.skill_paths sp on sp.id = usp.path_id
    where usp.status = 'in_progress'
      and usp.current_streak_days >= 2
      and usp.streak_last_counted_date = v_today - 1
      and not exists (
        select 1 from public.notifications n
        where n.user_id = usp.user_id
          and n.type = 'system'
          and n.link_path = '/growth/skills/paths/' || usp.path_id::text
          and n.created_at::date = v_today
      )
  loop
    insert into public.notifications (user_id, type, title, body, link_path)
    values (
      rec.user_id,
      'system',
      'Don''t lose your streak!',
      format('Your %s-day streak on %s ends tonight — come back for a few minutes to keep it alive.', rec.current_streak_days, rec.path_title),
      '/growth/skills/paths/' || rec.path_id::text
    );
  end loop;
end;
$$;

comment on function public.send_skill_streak_risk_notifications is
  'Sends a loss-aversion streak-risk nudge to users who were active yesterday but not yet today. Intended to be scheduled daily (e.g. via pg_cron), not called from the app. Writes to the existing public.notifications table, which already triggers push via on_notification_created_send_push — no parallel notification system.';
