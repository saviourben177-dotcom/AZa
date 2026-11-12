-- Fix: the "don't re-announce an opportunity for N days" check was keyed
-- only on whether a digest ROW was created (opportunity_match_digests),
-- not on whether the push notification for that digest was ever actually
-- delivered to the user's device. Before push_delivery_attempts existed
-- (added 2026-11-11), and during any stretch where the trigger/function/
-- FCM path was broken, a digest could be logged with no push ever
-- reaching the user -- and the old logic treated that the same as if
-- they'd seen it, permanently suppressing a re-match for up to 15 days
-- (the lookback + 1 window) with no way to recover except waiting it out.
--
-- Fix: a digest only counts toward the "already shown" suppression if its
-- linked notification has a push_delivery_attempts row with
-- outcome = 'accepted' (FCM accepted it -- the same bar every other path
-- in this app already uses to mean "delivered"). A digest with no
-- notification_id, no delivery-attempt row (not yet attempted, or
-- predates push_delivery_attempts), or an attempt that was 'no_token',
-- 'invalid_token', or 'failed' no longer blocks a fresh match -- the user
-- gets a real chance to actually receive it once their account's push
-- path is working.
--
-- This does not touch the per-user daily cap (at most one digest per user
-- per UTC day) or the dedupe against the legacy per-opportunity
-- notification type -- those are unrelated and unchanged.

create or replace function public.send_opportunity_match_notifications()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_lookback_days constant int := 14;
  v_today date := (now() at time zone 'utc')::date;
  rec record;
  v_notif_id uuid;
  v_title text;
  v_body text;
  v_link text;
  v_shown int;
begin
  -- Overlapping or retried runs: only one proceeds.
  if not pg_try_advisory_xact_lock(hashtext('send_opportunity_match_notifications')) then
    return;
  end if;

  for rec in
    with candidates as (
      select
        p.id as user_id,
        o.id as opp_id,
        o.title,
        o.org,
        o.deadline,
        o.created_at,
        coalesce(o.relevant_status <> '{}'::employment_status[] and o.relevant_status && p.status, false) as status_targeted,
        coalesce(o.region = p.region, false) as region_exact
      from public.profiles p
      join public.opportunities o
        on (
          -- status match: empty relevant_status = open to everyone
          o.relevant_status = '{}'::employment_status[]
          or o.relevant_status && p.status
        )
       and (
          -- region match: nationwide/worldwide matches everyone
          o.region in ('Nationwide', 'Worldwide')
          or o.region = p.region
        )
      where o.created_at >= now() - make_interval(days => v_lookback_days)
        and (o.deadline is null or o.deadline >= v_today)
        -- at most one digest per user per day
        and not exists (
          select 1 from public.opportunity_match_digests t
          where t.user_id = p.id and t.digest_date = v_today
        )
        -- not already CONFIRMED DELIVERED in a recent digest (window tied
        -- to the lookback). A digest row alone no longer suppresses --
        -- only one whose notification actually reached the device.
        and not exists (
          select 1
          from public.opportunity_match_digests d
          join public.push_delivery_attempts pda
            on pda.notification_id = d.notification_id
           and pda.outcome = 'accepted'
          where d.user_id = p.id
            and d.digest_date >= v_today - (v_lookback_days + 1)
            and o.id = any (d.opportunity_ids)
        )
        -- not already announced by the old per-opportunity notification
        and not exists (
          select 1 from public.notifications n
          where n.user_id = p.id
            and n.type = 'opportunity_match'
            and n.link_path = '/opportunities/' || o.id || '?r=match'
        )
        -- user already acted on it
        and not exists (
          select 1 from public.dismissed_opportunities x
          where x.user_id = p.id and x.opportunity_id = o.id
        )
        and not exists (
          select 1 from public.saved_opportunities s
          where s.user_id = p.id and s.opportunity_id = o.id
        )
    ),
    ranked as (
      select
        c.*,
        row_number() over (
          partition by c.user_id
          order by c.status_targeted desc, c.region_exact desc,
                   c.deadline asc nulls last, c.created_at desc, c.opp_id
        ) as rn,
        count(*) over (partition by c.user_id) as total
      from candidates c
    )
    select
      user_id,
      max(total)::int as total,
      array_agg(opp_id order by rn) as opp_ids,
      (array_agg(title order by rn))[1:5] as top_titles,
      (array_agg(org order by rn))[1] as top_org,
      (array_agg(deadline order by rn))[1] as top_deadline
    from ranked
    group by user_id
  loop
    if rec.total = 1 then
      v_title := 'New match: ' || left(rec.top_titles[1], 120);
      v_body := left(coalesce(rec.top_org, 'A new opportunity'), 150)
                || ' matches your profile. Deadline: '
                || coalesce(to_char(rec.top_deadline, 'FMMonth FMDD, YYYY'), 'rolling');
      v_link := '/opportunities/' || rec.opp_ids[1] || '?r=match';
    else
      v_title := rec.total::text || ' new opportunities match you';
      v_shown := array_length(rec.top_titles, 1);
      select string_agg('• ' || left(t, 60), E'\n')
        into v_body
        from unnest(rec.top_titles) as t;
      if rec.total > v_shown then
        v_body := v_body || E'\n+' || (rec.total - v_shown)::text || ' more';
      end if;
      -- Date in the link keeps (user_id, link_path) unique per day.
      v_link := '/discover?r=digest&d=' || to_char(v_today, 'YYYY-MM-DD');
    end if;

    begin
      insert into public.opportunity_match_digests (user_id, digest_date, opportunity_ids, match_count)
      values (rec.user_id, v_today, rec.opp_ids, rec.total)
      on conflict (user_id, digest_date) do nothing;

      if not found then
        continue;
      end if;

      insert into public.notifications (user_id, type, title, body, link_path)
      values (rec.user_id, 'opportunity_match', v_title, v_body, v_link)
      returning id into v_notif_id;

      update public.opportunity_match_digests
         set notification_id = v_notif_id
       where user_id = rec.user_id and digest_date = v_today;
    exception when others then
      -- Roll back only this user's digest row; others continue, this user is retried next run.
      raise warning 'opportunity match digest failed for user %: % (%)', rec.user_id, sqlerrm, sqlstate;
    end;
  end loop;
end;
$$;

comment on function public.send_opportunity_match_notifications() is
  'Daily job (pg_cron 07:15 UTC): creates at most one opportunity_match digest notification per user per UTC day. 14-day lookback. A past digest only suppresses a re-match for 15 days if its notification was CONFIRMED DELIVERED (push_delivery_attempts.outcome = accepted) -- an undelivered digest (no token, failed push, or predates delivery tracking) does not block a fresh attempt. See opportunity_match_digests, push_delivery_attempts.';

revoke execute on function public.send_opportunity_match_notifications() from public, anon, authenticated;
