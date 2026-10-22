-- Supabase's performance advisor flagged 69 RLS policies that call
-- auth.uid()/auth.<fn>() directly in their qual/with_check, which
-- Postgres re-evaluates once PER ROW rather than once per query. On
-- `profiles` specifically, this combines badly with having two
-- permissive SELECT policies (profiles_select_own, profiles_admin_all)
-- — every SELECT on profiles evaluates is_admin() per row, and
-- is_admin() itself queries profiles again. Since any query that embeds
-- profiles(...) or public_profiles(...) (team-finder, ideas feed, growth
-- hub, homepage, search, my-ideas, the profile page itself) joins through
-- this table, the per-row cost multiplies by every row returned — and
-- under load this is consistent with the PostgREST "Thread killed by
-- timeout manager" errors seen in the logs (255 occurrences over 24h),
-- which would surface in the app as a silently empty result (no RLS
-- rejection, no thrown error — the query just doesn't finish in time).
--
-- Fix: wrap auth.uid() in `(select auth.uid())` everywhere it appears in
-- a policy on `profiles` and `ideas` — these two are the tables directly
-- implicated in the reported bugs. Postgres caches a `(select ...)`
-- sub-select's result for the duration of the statement instead of
-- re-running it per row. This changes nothing about who can see what —
-- only how many times the check runs.

-- profiles --------------------------------------------------------------

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select profiles_1.role from public.profiles profiles_1 where profiles_1.id = (select auth.uid()))
  );

-- profiles_admin_all (ALL, qual/with_check = is_admin()) is left as-is:
-- is_admin() is SECURITY DEFINER and STABLE already, and there's no bare
-- auth.uid() in this policy's own qual to wrap — the per-row cost here
-- comes from is_admin()'s internal query, which this migration doesn't
-- change, so admin behavior is unaffected.

-- ideas -------------------------------------------------------------------

drop policy if exists ideas_public_read on public.ideas;
create policy ideas_public_read
  on public.ideas for select
  to anon, authenticated
  using (visibility = 'public' or user_id = (select auth.uid()));

drop policy if exists ideas_owner_insert on public.ideas;
create policy ideas_owner_insert
  on public.ideas for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists ideas_owner_update on public.ideas;
create policy ideas_owner_update
  on public.ideas for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists ideas_owner_or_curator_delete on public.ideas;
create policy ideas_owner_or_curator_delete
  on public.ideas for delete
  to authenticated
  using (user_id = (select auth.uid()) or is_curator_or_admin());

drop policy if exists ideas_editorial_seed_insert on public.ideas;
create policy ideas_editorial_seed_insert
  on public.ideas for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles caller
      where caller.id = (select auth.uid()) and caller.role = any (array['admin'::user_role, 'editorial'::user_role])
    )
    and exists (
      select 1 from public.profiles target
      where target.id = ideas.user_id and target.role = 'editorial'::user_role
    )
  );
