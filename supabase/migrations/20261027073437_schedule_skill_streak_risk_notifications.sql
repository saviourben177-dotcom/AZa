-- Schedules the streak-risk nudge function (defined in
-- 20261025182553_skills_paths_feature.sql) to actually run daily. Until this
-- migration, send_skill_streak_risk_notifications() existed but nothing
-- ever called it. pg_cron and pg_net are already enabled on this project
-- (used by send-deadline-reminders / send-opportunity-match-notifications),
-- so this follows the exact same pattern: a plain daily cron.schedule
-- calling the public function directly, no pg_net/webhook needed since the
-- function itself just writes to public.notifications.
--
-- Time: 22:30 UTC. The nudge targets users whose streak "will lapse at UTC
-- midnight with no activity today" (per the function's own comment) — so it
-- needs to fire late enough in the UTC day to be a genuine last-chance
-- warning, not a noisy early-morning ping hours before the deadline.
-- 22:30 avoids colliding with the existing 07:00/07:15 UTC jobs.

select
  cron.schedule(
    'send-skill-streak-risk-notifications',
    '30 22 * * *',
    $$ select public.send_skill_streak_risk_notifications(); $$
  );
