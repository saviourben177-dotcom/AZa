-- Restore public_profiles to its original behaviour (all users, id/full_name/avatar_url)
-- so existing features (idea authors, comments, team-finder) are not affected by the
-- new Public/Private setting. Privacy is instead enforced on the new profile page and
-- on follow / message actions via profiles.is_public.
-- Applied directly to the Supabase project (2026-09-26).
drop view public.public_profiles;

create view public.public_profiles as
  select id, full_name, avatar_url
  from public.profiles;

grant select on public.public_profiles to authenticated, anon;

comment on view public.public_profiles is
  'Safe, RLS-bypassing subset of profiles (id, name, avatar) for displaying other users app-wide, e.g. idea authors. Deliberately NOT filtered by profiles.is_public: the Public/Private setting controls the /u/[id] profile page, following and direct messaging, not whether a name appears next to content the user posted.';

-- Small definer function so the app can check "is this profile public?" without
-- exposing any other profile column and without reopening profiles RLS.
create or replace function public.is_profile_public(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_public from public.profiles where id = p_user_id), false);
$$;

revoke all on function public.is_profile_public(uuid) from public;
grant execute on function public.is_profile_public(uuid) to authenticated;

-- Server-side enforcement: you can only follow a public profile, and only start a
-- conversation with a public profile.
drop policy follows_insert_own on public.follows;
create policy follows_insert_own
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid() and public.is_profile_public(following_id));

drop policy conversations_participant_insert on public.conversations;
create policy conversations_participant_insert
  on public.conversations for insert
  to authenticated
  with check (
    (auth.uid() = user_a_id or auth.uid() = user_b_id)
    and public.is_profile_public(case when auth.uid() = user_a_id then user_b_id else user_a_id end)
  );
