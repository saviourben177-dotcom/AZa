-- Harden Android push delivery accounting and explicit account sign-out.
-- No token is removed based on age or user inactivity.

create table if not exists public.push_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_token_id uuid references public.device_push_tokens(id) on delete set null,
  outcome text not null check (outcome in ('accepted', 'invalid_token', 'failed', 'no_token')),
  fcm_status text,
  attempted_at timestamptz not null default now()
);

alter table public.push_delivery_attempts enable row level security;
revoke all on public.push_delivery_attempts from public;

create index if not exists push_delivery_attempts_notification_id_idx
  on public.push_delivery_attempts(notification_id, attempted_at desc);
create index if not exists push_delivery_attempts_user_id_idx
  on public.push_delivery_attempts(user_id, attempted_at desc);

create or replace function public.release_push_token(p_fcm_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.device_push_tokens
  where fcm_token = p_fcm_token
    and user_id = auth.uid();
end;
$$;

revoke all on function public.release_push_token(text) from public;
grant execute on function public.release_push_token(text) to authenticated;

create or replace function public.trigger_send_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  supabase_url text;
  trigger_token text;
begin
  select decrypted_secret into supabase_url
  from vault.decrypted_secrets
  where name = 'push_supabase_url'
  limit 1;

  select decrypted_secret into trigger_token
  from vault.decrypted_secrets
  where name = 'push_trigger_token'
  limit 1;

  if supabase_url is null or trigger_token is null then
    return new;
  end if;

  perform net.http_post(
    url := supabase_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-aza-push-token', trigger_token
    ),
    body := jsonb_build_object(
      'notification_id', new.id,
      'user_id', new.user_id,
      'title', new.title,
      'body', new.body,
      'link_path', new.link_path
    )
  );

  return new;
end;
$$;
