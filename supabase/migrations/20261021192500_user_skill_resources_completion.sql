-- Replaces the flat "+10%" button (src/components/.../skill-card.tsx —
-- any click added 10 to user_skills.progress_percent regardless of
-- whether the user actually did anything) with a real completion record.
--
-- user_skills.progress_percent stays as a column (other code may still
-- read it, and dropping it is a bigger, separate change) but is no longer
-- written by updateSkillProgress's old "bump by N" path — see the
-- accompanying app-code change in src/lib/actions/skills.ts, which now
-- recomputes it from this table (completed resources / total resources
-- for that skill) every time a resource is marked complete or
-- uncompleted, instead of accepting an arbitrary client-supplied number.

create table if not exists public.user_skill_resources (
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.skill_resources(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

comment on table public.user_skill_resources is
  'A user marking one specific skill_resources row as completed. The real signal user_skills.progress_percent is now computed from (one row per skill via skill_resources.skill_id) — replaces the old flat "+10% per click" button, which had no connection to any actual activity.';

alter table public.user_skill_resources enable row level security;

create policy user_skill_resources_owner_all
  on public.user_skill_resources
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists user_skill_resources_resource_id_idx
  on public.user_skill_resources (resource_id);
