-- Content reports. This migration is deliberately idempotent because it was
-- first applied to the live Aza project while the UI work was in progress.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('message', 'idea', 'idea_comment')),
  content_id uuid not null,
  content_preview text not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists reports_status_created_at_idx on public.reports (status, created_at desc);
create index if not exists reports_reported_user_id_idx on public.reports (reported_user_id);

alter table public.reports enable row level security;

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists reports_curator_read on public.reports;
create policy reports_curator_read on public.reports
  for select to authenticated
  using (public.is_curator_or_admin());

drop policy if exists reports_curator_update on public.reports;
create policy reports_curator_update on public.reports
  for update to authenticated
  using (public.is_curator_or_admin())
  with check (public.is_curator_or_admin());

create or replace function public.notify_new_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link_path)
  select id, 'system', 'New content report', left(new.content_preview, 160), '/curator/reports'
  from public.profiles
  where role in ('curator', 'admin');
  return new;
end;
$$;

drop trigger if exists on_report_created_notify on public.reports;
create trigger on_report_created_notify
after insert on public.reports
for each row execute function public.notify_new_report();
