-- Extends the admin seeder (see 20260907095600_admin_content_seeder_v1) to
-- let @Aza own seeded teams directly, without opening a general
-- "insert idea as anyone" hole.
--
-- Scope: this policy only permits an editorial/admin caller to insert an
-- idea when user_id is EXACTLY the caller's own id, OR when user_id belongs
-- to a profile with role = 'editorial'. In practice this means:
--   - an admin can still create teams under their own account (unchanged)
--   - an admin OR editorial-role caller can additionally create an idea
--     owned by the @Aza editorial identity specifically
-- It does NOT let anyone insert an idea owned by an arbitrary other user.
--
-- Existing "ideas_owner_insert" policy (user_id = auth.uid()) is untouched
-- and still applies for ordinary users.
--
-- NOTE: this migration was already applied directly to the live Supabase
-- project (saongnctrioxuvdcsmbw) via the Supabase MCP during this session.
-- Add this file to your local supabase/migrations/ folder so your migration
-- history stays in sync with the remote project -- do not re-run it if the
-- policy already exists.

create policy ideas_editorial_seed_insert on public.ideas
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles caller
      where caller.id = auth.uid()
        and caller.role in ('admin', 'editorial')
    )
    and exists (
      select 1 from public.profiles target
      where target.id = ideas.user_id
        and target.role = 'editorial'
    )
  );

-- Removal (part of the same teardown as the rest of the seeder):
--   drop policy ideas_editorial_seed_insert on public.ideas;
