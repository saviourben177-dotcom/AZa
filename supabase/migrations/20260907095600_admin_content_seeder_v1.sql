-- Admin Content Seeder (temporary, isolated, removable) --------------------
-- Scope: /admin routes only. Does NOT touch join_requests, notification
-- triggers, is_curator_or_admin(), or any existing table's policies.
-- Removal procedure lives in the trailing comment block.
--
-- NOTE: this migration was already applied directly to the live Supabase
-- project (saongnctrioxuvdcsmbw) via the Supabase MCP during this session.
-- Add this file to your local supabase/migrations/ folder so your migration
-- history stays in sync with the remote project -- do not re-run it if the
-- objects already exist.

-- 1. Narrow write policies for the editorial identity (@Aza) on businesses.
--    idea_library is untouched: its existing policies already permit 'editorial'.
create policy businesses_editorial_write on public.businesses
  for insert to authenticated with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editorial','admin'))
  );

create policy businesses_editorial_update on public.businesses
  for update to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editorial','admin'))
  );

create policy businesses_editorial_delete on public.businesses
  for delete to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editorial','admin'))
  );

-- 2. Audit log for the seeder. Isolated table, no FKs point into it,
--    nothing outside /admin ever reads or writes it.
create table public.admin_content_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text not null check (action in ('create','update','delete','bulk_import')),
  table_name text not null,
  record_id uuid,
  summary text,
  created_at timestamptz not null default now()
);

alter table public.admin_content_log enable row level security;

create policy admin_content_log_admin_read on public.admin_content_log
  for select to authenticated using (is_admin());

-- No INSERT/UPDATE/DELETE policy for any client role: writes only via the
-- SECURITY DEFINER function below, so even an admin session can't forge
-- entries directly through PostgREST.

create or replace function public.log_admin_action(
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_summary text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editorial')
  ) then
    raise exception 'not authorized';
  end if;

  insert into public.admin_content_log (admin_id, action, table_name, record_id, summary)
  values (auth.uid(), p_action, p_table_name, p_record_id, p_summary);
end;
$$;

revoke all on function public.log_admin_action(text, text, uuid, text) from public;
grant execute on function public.log_admin_action(text, text, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- REMOVAL PROCEDURE (run when the seeder is retired, e.g. after adopting a
-- proper CMS). Nothing outside this migration and src/app/admin,
-- src/lib/actions/admin depends on these objects.
--
--   drop policy businesses_editorial_write on public.businesses;
--   drop policy businesses_editorial_update on public.businesses;
--   drop policy businesses_editorial_delete on public.businesses;
--   drop function public.log_admin_action(text, text, uuid, text);
--   drop table public.admin_content_log;
--
-- Then: rm -rf src/app/admin src/lib/actions/admin
-- ---------------------------------------------------------------------------
