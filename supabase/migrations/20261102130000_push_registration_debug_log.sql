-- A visible trail for push registration attempts, so a failure anywhere in
-- the client-side flow (permission check, native register() call, the
-- "registration"/"registrationError" listener, or the final save) shows up
-- here instead of only in a device's own console log, which nobody can see
-- after the fact for a report like "it's not working" from a real user.
create table if not exists public.push_registration_debug (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event text not null,
  detail jsonb,
  platform text,
  app_version text,
  created_at timestamptz not null default now()
);

alter table public.push_registration_debug enable row level security;

-- Users can insert their own diagnostic rows (and nothing else — no read,
-- update, or delete from the client; this is a one-way write log).
create policy "Users can log their own push diagnostics"
  on public.push_registration_debug
  for insert
  with check (auth.uid() = user_id);

-- user_id can be null for pre-auth events (permission denied before login,
-- native register() failing before saveToken() ever runs) — allow those too,
-- since they're exactly the silent-failure cases this exists to catch.
create policy "Anonymous pre-auth push diagnostics"
  on public.push_registration_debug
  for insert
  with check (user_id is null);

create index if not exists push_registration_debug_user_id_idx
  on public.push_registration_debug(user_id, created_at desc);

create index if not exists push_registration_debug_event_idx
  on public.push_registration_debug(event, created_at desc);

revoke all on public.push_registration_debug from public;
grant insert on public.push_registration_debug to authenticated, anon;
