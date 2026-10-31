-- Real "Get started" checklist, backend part 2.
--
-- Separate migration from 20261031120100 because Postgres will not let a
-- newly-added enum value (getting_started_reminder, added there) be used
-- inside the same transaction that added it — the same split pattern used
-- elsewhere in this schema for enum additions.
--
-- Mirrors send_skill_streak_risk_notifications in
-- 20261025182828_skills_paths_feature.sql: a plain function that scans and
-- inserts into public.notifications (push fires automatically via the
-- existing on_notification_created_send_push trigger), scheduled by a
-- separate cron migration, not called from the app.

create or replace function public.send_getting_started_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  rec record;
begin
  if not pg_try_advisory_xact_lock(hashtext('send_getting_started_reminders')) then
    return;
  end if;

  -- "Stuck at only profile done" = signed up roughly a day ago, and none
  -- of the other three real signals exist yet: no saved opportunity, no
  -- generated CV, no Growth Hub visit. One nudge per user, ever — this is
  -- a single onboarding prompt, not a recurring notification, so it never
  -- repeats regardless of whether the user later returns and stalls again.
  for rec in
    select p.id as user_id
    from public.profiles p
    where p.created_at <= v_now - interval '24 hours'
      and p.created_at > v_now - interval '72 hours'
      and not exists (select 1 from public.saved_opportunities so where so.user_id = p.id)
      and not exists (
        select 1 from public.cv_profiles cp
        where cp.user_id = p.id and cp.generated_at is not null
      )
      and not exists (select 1 from public.growth_hub_visits ghv where ghv.user_id = p.id)
      and not exists (
        select 1 from public.notifications n
        where n.user_id = p.id and n.type = 'getting_started_reminder'
      )
  loop
    insert into public.notifications (user_id, type, title, body, link_path)
    values (
      rec.user_id,
      'getting_started_reminder',
      'Pick up where you left off',
      'You''ve got a profile on Aza — save an opportunity, preview your CV, or check out the Growth Hub to get the most out of it.',
      '/'
    );
  end loop;
end;
$$;

comment on function public.send_getting_started_reminders is
  'Sends a one-time nudge to users who signed up 24-72h ago and have done nothing beyond creating a profile (no saved opportunity, no generated CV, no Growth Hub visit). Intended to be scheduled daily (e.g. via pg_cron), not called from the app. The 72h upper bound keeps this from re-scanning very old stale accounts forever; the not-exists-notifications check keeps it to exactly one send per user.';
