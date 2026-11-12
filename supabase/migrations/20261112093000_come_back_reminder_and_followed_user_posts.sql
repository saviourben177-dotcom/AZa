-- Two new notification types, requested separately from the push-delivery
-- bug fix:
--
-- 1. come_back_reminder: a generic evening nudge ("come check skills/
--    opportunities/ideas") for any user who hasn't opened the app today,
--    per device_push_tokens.last_seen_at (updated on app open/resume).
--    Not tied to any specific event -- purely a re-engagement prompt, same
--    spirit as apps that ping you if you haven't opened them that day. One
--    per user per UTC day, sent once daily in the evening. Copy rotates
--    across a few short variants so it doesn't read as the same robotic
--    line every night.
--
--    NOTE: this originally used user_core_streaks.last_activity_at, which
--    looked like the right "last active" signal but turned out to track
--    only 4 narrow, deliberately-scoped actions (apply to an opportunity,
--    send a join request, update an already-generated CV, post an idea --
--    see 20261031120400_core_loop_streak.sql), NOT general app opens. As
--    of today zero users have ever triggered any of those 4 actions, so
--    every single user would have been flagged "inactive" every night --
--    not what was wanted. Switched to device_push_tokens.last_seen_at,
--    which is updated on every app open/resume and is a much better match
--    for "haven't opened the app today."
--
-- 2. followed_user_post: when a user posts something public (a new idea,
--    marketplace listing, or portfolio entry), their followers get
--    notified -- but throttled per (follower, author) pair so a prolific
--    poster, or a user following many active people, doesn't spam. Window
--    is 6 hours: if the same author already triggered a notification for
--    a given follower within the last 6 hours, this post folds into that
--    existing notification (title bumps to "N new posts from X") instead
--    of sending a second one.

alter type public.notification_type add value if not exists 'come_back_reminder';
alter type public.notification_type add value if not exists 'followed_user_post';

-- === Feature 1: come-back reminder =========================================

create or replace function public.send_come_back_reminders()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_variants constant text[] := array[
    'Haven''t seen you today — new opportunities and ideas are waiting.',
    'Quick visit? Check what''s new in Growth and Discover.',
    'A few minutes today keeps your momentum going. Come take a look.',
    'Come see what''s new on Aza today.'
  ];
  v_body text;
begin
  if not pg_try_advisory_xact_lock(hashtext('send_come_back_reminders')) then
    return;
  end if;

  -- Pick one variant per run (same for everyone today, varies day to day)
  -- so the whole cohort doesn't get identical copy every single night.
  v_body := v_variants[1 + (extract(doy from v_today)::int % array_length(v_variants, 1))];

  insert into public.notifications (user_id, type, title, body, link_path)
  select
    p.id,
    'come_back_reminder',
    'We miss you!',
    v_body,
    '/'
  from public.profiles p
  where
    -- hasn't opened the app today, per the most recent device token
    -- check-in (device_push_tokens.last_seen_at, updated whenever the app
    -- registers/refreshes its push token on open/resume). A user with no
    -- token row at all (never granted push permission) is treated as
    -- "not seen today" too, since we have no better signal for them.
    not exists (
      select 1 from public.device_push_tokens t
      where t.user_id = p.id
        and (t.last_seen_at at time zone 'utc')::date = v_today
    )
    -- not already sent one today
    and not exists (
      select 1 from public.notifications n
      where n.user_id = p.id
        and n.type = 'come_back_reminder'
        and (n.created_at at time zone 'utc')::date = v_today
    )
    -- don't nag brand-new signups the same day they joined, or accounts
    -- in the getting_started window (that flow already reaches out)
    and p.created_at < now() - interval '3 days';
end;
$$;

comment on function public.send_come_back_reminders() is
  'Daily job (pg_cron, evening WAT): generic re-engagement nudge for any user who has not opened the app today, per device_push_tokens.last_seen_at (updated on app open/resume -- NOT the same as user_core_streaks, which only tracks 4 specific qualifying actions and is unsuitable for a simple "opened the app" check). One per user per UTC day. Skips accounts <3 days old (covered by getting_started_reminder instead).';

revoke execute on function public.send_come_back_reminders() from public, anon, authenticated;

select
  cron.schedule(
    'send-come-back-reminders',
    '0 19 * * *', -- 19:00 UTC = 20:00 WAT, evening
    $cron$select public.send_come_back_reminders();$cron$
  )
where not exists (
  select 1 from cron.job where jobname = 'send-come-back-reminders'
);

-- === Feature 2: followed-user-post notifications ============================

create or replace function public.notify_followers_of_post(
  p_author_id uuid,
  p_content_kind text,   -- 'idea' | 'business' | 'portfolio_entry'
  p_title text,
  p_link_path text
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_follower record;
  v_existing record;
  v_author_name text;
  v_new_title text;
  v_new_body text;
begin
  select coalesce(full_name, 'Someone you follow') into v_author_name
  from public.profiles where id = p_author_id;

  for v_follower in
    select follower_id from public.follows where following_id = p_author_id
  loop
    -- Throttle: fold into an existing notification from the same author to
    -- the same follower if one landed in the last 6 hours, instead of
    -- sending a new one. Keeps an active poster, or a follower who follows
    -- many active users, from getting spammed one-notification-per-post.
    select n.id, n.title
      into v_existing
      from public.notifications n
     where n.user_id = v_follower.follower_id
       and n.type = 'followed_user_post'
       and n.link_path = '/u/' || p_author_id
       and n.created_at >= now() - interval '6 hours'
     order by n.created_at desc
     limit 1;

    if v_existing.id is not null then
      -- Bump the existing notification's count/title rather than add a new row.
      v_new_title :=
        case
          when v_existing.title ~ '^\d+ new posts from '
            then (substring(v_existing.title from '^\d+')::int + 1)::text
                 || ' new posts from ' || v_author_name
          else '2 new posts from ' || v_author_name
        end;

      update public.notifications
         set title = v_new_title,
             body = left(p_title, 150),
             created_at = now(),
             read_at = null
       where id = v_existing.id;
    else
      insert into public.notifications (user_id, type, title, body, link_path)
      values (
        v_follower.follower_id,
        'followed_user_post',
        v_author_name || ' posted',
        left(p_title, 150),
        -- Links to the author's profile (shows all their recent posts),
        -- not the single item, since this notification may represent
        -- several posts once folded together above.
        '/u/' || p_author_id
      );
    end if;
  end loop;
end;
$$;

comment on function public.notify_followers_of_post(uuid, text, text, text) is
  'Notifies all followers of p_author_id that they posted. Folds into an existing followed_user_post notification for the same (follower, author) pair if one was created in the last 6 hours, instead of sending a new one each time -- prevents spam from prolific posters or followers who follow many active users. Called from triggers on ideas, marketplace_listings, portfolio_entries.';

revoke execute on function public.notify_followers_of_post(uuid, text, text, text) from public, anon, authenticated;

-- Trigger: new idea (only notify for ideas visible to followers, i.e. not drafts)
create or replace function public.trigger_notify_followers_new_idea()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.visibility = 'public' then
    perform public.notify_followers_of_post(new.user_id, 'idea', new.title, '/growth/ideas/' || new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_idea_created_notify_followers on public.ideas;
create trigger on_idea_created_notify_followers
  after insert on public.ideas
  for each row
  execute function public.trigger_notify_followers_new_idea();

-- Trigger: new marketplace listing (only once it's actually live, not draft/pending)
create or replace function public.trigger_notify_followers_new_listing()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'active' then
    perform public.notify_followers_of_post(new.user_id, 'business', new.title, '/business/' || new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_listing_created_notify_followers on public.marketplace_listings;
create trigger on_listing_created_notify_followers
  after insert on public.marketplace_listings
  for each row
  execute function public.trigger_notify_followers_new_listing();

-- Trigger: new portfolio entry (always public once created -- no draft state)
create or replace function public.trigger_notify_followers_new_portfolio_entry()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform public.notify_followers_of_post(new.user_id, 'portfolio_entry', new.title, '/u/' || new.user_id);
  return new;
end;
$$;

drop trigger if exists on_portfolio_entry_created_notify_followers on public.portfolio_entries;
create trigger on_portfolio_entry_created_notify_followers
  after insert on public.portfolio_entries
  for each row
  execute function public.trigger_notify_followers_new_portfolio_entry();
