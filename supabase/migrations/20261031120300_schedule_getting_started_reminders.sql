-- Schedules send_getting_started_reminders() (defined in
-- 20261031120200_getting_started_reminder_function.sql) to actually run
-- daily. Same plain cron.schedule pattern as
-- 20261027073437_schedule_skill_streak_risk_notifications.sql — pg_cron and
-- pg_net are already enabled on this project.
--
-- Time: 08:00 UTC. Clear of the existing 07:00/07:15 UTC opportunity-match
-- digest jobs and the 22:30 UTC streak-risk job.

select
  cron.schedule(
    'send-getting-started-reminders',
    '0 8 * * *',
    $$ select public.send_getting_started_reminders(); $$
  );
