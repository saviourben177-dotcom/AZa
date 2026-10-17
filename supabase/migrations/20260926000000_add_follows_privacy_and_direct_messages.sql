-- Adds three independent, additive features. Nothing here changes any
-- existing table's shape in a breaking way, and no existing RLS policy,
-- trigger, or the join_requests-based messaging path is modified.
--
-- 1) Follows: a simple follower/following edge between two profiles.
-- 2) Privacy: profiles.is_public gates whether a profile is visible to
--    other users via public_profiles (own profile is always visible to
--    its owner through the existing profiles_select_own policy).
-- 3) Direct messages: the existing `messages` table was hard-scoped to
--    join_request_id (team-finder only). Rather than build a second,
--    parallel messaging system, this generalizes the same table with a
--    new `conversations` table and a nullable `conversation_id` column,
--    so the existing message bubble UI/thread pattern can be reused for
--    a direct "Message" button on a profile. join_request_id stays
--    NOT NULL-equivalent in behavior for existing rows (all existing
--    rows keep their join_request_id; new direct-message rows use
--    conversation_id instead and leave join_request_id null).
--
-- Applied directly to the Supabase project (2026-09-26). This file is
-- kept here so migration history stays in sync, same as the admin
-- content seeder migrations — see README.md.

-- ---------------------------------------------------------------------
-- 1) Follows
-- ---------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

comment on table public.follows is
  'A follows B: follower_id follows following_id. No approval step (unlike join_requests) — following is immediate, matching common social-app conventions.';

alter table public.follows enable row level security;

-- Anyone signed in can see who follows whom (needed to render follower/
-- following counts and "Following" state on a profile you are viewing).
create policy follows_read_all
  on public.follows for select
  to authenticated
  using (true);

create policy follows_insert_own
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid());

create policy follows_delete_own
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());

create index follows_following_id_idx on public.follows (following_id);
create index follows_follower_id_idx on public.follows (follower_id);

-- ---------------------------------------------------------------------
-- 2) Public/private profile
-- ---------------------------------------------------------------------
alter table public.profiles
  add column is_public boolean not null default true;

comment on column public.profiles.is_public is
  'When false, this profile is hidden from public_profiles (other users cannot view the profile page, follow, or message the user). The owner can always see and edit their own profile via profiles_select_own regardless of this flag. Defaults true so no existing user''s visibility changes.';

-- Recreate public_profiles to respect is_public. Same columns as before
-- (id, full_name, avatar_url) plus is_public itself so the client can
-- distinguish "not found" from "private" if ever needed — existing
-- callers that only select full_name/avatar_url are unaffected.
drop view public.public_profiles;

create view public.public_profiles as
  select id, full_name, avatar_url, is_public
  from public.profiles
  where is_public = true;

grant select on public.public_profiles to authenticated, anon;

comment on view public.public_profiles is
  'Safe, RLS-bypassing subset of profiles for displaying other users (name/avatar) app-wide. Now filtered to is_public = true profiles only, so switching a profile to private removes it from here immediately.';

-- ---------------------------------------------------------------------
-- 3) Direct messages (generalizes the existing `messages` table)
-- ---------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_no_self check (user_a_id <> user_b_id),
  -- Store the pair in a canonical order so a unique index can prevent
  -- duplicate conversations regardless of who initiated it.
  constraint conversations_ordered_pair check (user_a_id < user_b_id)
);

comment on table public.conversations is
  'A direct-message thread between two users, started from the Message button on a profile. Independent of join_requests/team-finder. user_a_id/user_b_id are stored with the smaller uuid first (conversations_ordered_pair) purely so the unique index below can treat (A,B) and (B,A) as the same conversation.';

create unique index conversations_pair_unique on public.conversations (user_a_id, user_b_id);

alter table public.conversations enable row level security;

create policy conversations_participant_read
  on public.conversations for select
  to authenticated
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy conversations_participant_insert
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Generalize messages: allow a message to belong to either a
-- join_request thread (existing behavior, untouched) or a direct
-- conversation (new). Exactly one of the two must be set.
alter table public.messages
  alter column join_request_id drop not null;

alter table public.messages
  add column conversation_id uuid references public.conversations(id) on delete cascade;

alter table public.messages
  add constraint messages_exactly_one_thread
  check (
    (join_request_id is not null and conversation_id is null)
    or (join_request_id is null and conversation_id is not null)
  );

comment on column public.messages.conversation_id is
  'Set for direct profile-to-profile messages (see conversations). Mutually exclusive with join_request_id, which remains the path for accepted-team-finder-request threads — see messages_exactly_one_thread.';

-- New, additive RLS policies for the conversation-based path. The
-- existing messages_participant_read / messages_participant_insert
-- policies are untouched and continue to govern join_request_id rows;
-- Postgres RLS policies are OR'd together, so a row is visible if it
-- satisfies either the old policy or this new one.
create policy messages_conversation_participant_read
  on public.messages for select
  to authenticated
  using (
    conversation_id is not null
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

create policy messages_conversation_participant_insert
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and conversation_id is not null
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

create index messages_conversation_id_idx on public.messages (conversation_id);
