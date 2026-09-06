-- Push notifications: device token storage + auto-send trigger
-- Apply with Supabase:apply_migration (or paste into SQL editor)

-- 1. Table to store one row per registered device (a user can have multiple devices)
create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fcm_token text not null unique,
  platform text not null default 'android',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.device_push_tokens enable row level security;

-- users can only manage their own tokens
create policy "Users manage own push tokens"
  on public.device_push_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists device_push_tokens_user_id_idx
  on public.device_push_tokens(user_id);

-- 2. Enable pg_net so Postgres can call the Edge Function over HTTP
create extension if not exists pg_net;

-- 3. Store the project URL + service role key as Postgres settings so the
--    trigger function can reach the Edge Function. Run these two lines
--    manually in the SQL editor after this migration (values are secrets,
--    kept out of the migration file / git history):
--
--    alter database postgres set app.settings.supabase_url = 'https://saongnctrioxuvdcsmbw.supabase.co';
--    alter database postgres set app.settings.service_role_key = '<your service_role key>';

-- 4. Trigger function: fires on every new row in notifications,
--    calls the send-push Edge Function asynchronously (fire-and-forget via pg_net)
create or replace function public.trigger_send_push_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  supabase_url text := current_setting('app.settings.supabase_url', true);
  service_key text := current_setting('app.settings.service_role_key', true);
begin
  if supabase_url is null or service_key is null then
    -- settings not configured yet; skip silently rather than blocking the insert
    return new;
  end if;

  perform net.http_post(
    url := supabase_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'user_id', new.user_id,
      'title', new.title,
      'body', new.body,
      'link_path', new.link_path
    )
  );

  return new;
end;
$$;

drop trigger if exists on_notification_created_send_push on public.notifications;

create trigger on_notification_created_send_push
  after insert on public.notifications
  for each row
  execute function public.trigger_send_push_notification();
