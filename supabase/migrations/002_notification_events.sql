-- Wire the existing in-app notifications table to real user events.
-- Push delivery is handled separately by the notifications -> send-push trigger.

-- 1. New team-join request -> notify the idea owner.
create or replace function public.notify_join_request_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select i.user_id into owner_id
  from public.ideas i
  where i.id = new.idea_id;

  if owner_id is not null and owner_id <> new.requester_id then
    insert into public.notifications (
      user_id, type, title, body, link_path
    )
    values (
      owner_id,
      'join_request_received',
      'New team request',
      'Someone wants to join your team for an idea.',
      '/businesses/team-finder/requests'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_join_request_created_notify on public.join_requests;
create trigger on_join_request_created_notify
after insert on public.join_requests
for each row
execute function public.notify_join_request_received();


-- 2. Accepted/declined request -> notify the person who requested to join.
create or replace function public.notify_join_request_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status
     and new.status in ('accepted', 'declined') then

    insert into public.notifications (
      user_id, type, title, body, link_path
    )
    values (
      new.requester_id,
      case
        when new.status = 'accepted'
          then 'join_request_accepted'::notification_type
        else 'join_request_declined'::notification_type
      end,
      case
        when new.status = 'accepted' then 'Team request accepted'
        else 'Team request declined'
      end,
      case
        when new.status = 'accepted'
          then 'Your request to join the team was accepted.'
        else 'Your request to join the team was declined.'
      end,
      '/businesses/team-finder/requests'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_join_request_response_notify on public.join_requests;
create trigger on_join_request_response_notify
after update of status on public.join_requests
for each row
execute function public.notify_join_request_response();


-- 3. New team message -> notify the other participant.
create or replace function public.notify_new_team_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_id uuid;
  owner_id uuid;
  recipient_id uuid;
begin
  select
    jr.requester_id,
    i.user_id
  into requester_id, owner_id
  from public.join_requests jr
  join public.ideas i on i.id = jr.idea_id
  where jr.id = new.join_request_id;

  if new.sender_id = requester_id then
    recipient_id := owner_id;
  else
    recipient_id := requester_id;
  end if;

  if recipient_id is not null and recipient_id <> new.sender_id then
    insert into public.notifications (
      user_id, type, title, body, link_path
    )
    values (
      recipient_id,
      'new_message',
      'New team message',
      left(new.body, 160),
      '/businesses/team-finder/messages/' || new.join_request_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_team_message_created_notify on public.messages;
create trigger on_team_message_created_notify
after insert on public.messages
for each row
execute function public.notify_new_team_message();


-- 4. Idea upvote -> notify the idea owner, but not when they upvote their own idea.
create or replace function public.notify_idea_upvote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id
  from public.ideas
  where id = new.idea_id;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (
      user_id, type, title, body, link_path
    )
    values (
      owner_id,
      'idea_upvote',
      'Your idea got an upvote',
      'Someone upvoted your idea.',
      '/growth/ideas/' || new.idea_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_idea_upvote_created_notify on public.idea_upvotes;
create trigger on_idea_upvote_created_notify
after insert on public.idea_upvotes
for each row
execute function public.notify_idea_upvote();
