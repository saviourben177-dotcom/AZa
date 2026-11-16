-- Make the portfolio entry on final-checkpoint completion genuinely
-- optional, per spec (the final checkpoint "adds to your portfolio,
-- optional"). Previously complete_skill_checkpoint() always inserted a
-- portfolio_entries row on a final-checkpoint pass; path completion status
-- and the three ratings still always get written on pass (finishing the
-- path isn't optional, only the portfolio artifact is) — only the
-- portfolio_entries insert is now gated on the new parameter.
--
-- Adding a new trailing parameter (even with a default) makes this a
-- distinct overload to Postgres, not a true replace — so the old 6-arg
-- signature must be dropped explicitly or both versions coexist and every
-- future bare-name reference (including `comment on function`) becomes
-- ambiguous.

drop function if exists public.complete_skill_checkpoint(uuid, text, text, text, text, text[]);

create or replace function public.complete_skill_checkpoint(
  p_submission_id uuid,
  p_status text, -- 'passed' | 'failed'
  p_portfolio_title text default null,
  p_portfolio_description text default null,
  p_portfolio_project_url text default null,
  p_portfolio_tags text[] default '{}',
  p_add_to_portfolio boolean default true
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
          rating_consistency = case
            when v_pace_ratio >= 0.5 then 5
            when v_pace_ratio >= 0.25 then 4
            when v_pace_ratio >= 0.1 then 3
            else 2
          end
      where user_id = v_user_id and path_id = v_checkpoint.path_id;

    if p_add_to_portfolio then
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
    end if;
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

comment on function public.complete_skill_checkpoint(uuid, text, text, text, text, text[], boolean) is
  'Persists an already-decided pass/fail result for a submission. On pass: marks the checkpoint complete, unlocks the next one, bumps the streak, and — if this was the final checkpoint — always writes the three completion ratings and marks the path completed, and additionally writes a portfolio_entries row only when p_add_to_portfolio is true (default true for backward compatibility; the final-checkpoint UI passes this explicitly based on the learner''s own "add to portfolio" choice).';
