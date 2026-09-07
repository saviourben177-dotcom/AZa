# Aza Admin Content Seeder (temporary launch tool)

This is **not** a permanent Aza subsystem. It exists to remove the
account-switching/manual-entry tedium of populating Businesses, Idea
Library, and Team Finder before launch. Once you have real content and
users, or if you adopt a proper CMS (e.g. Directus), this should be deleted.

## What this touches

- One migration: `supabase/migrations/<timestamp>_admin_content_seeder_v1.sql`
- `src/app/admin/**`
- `src/lib/actions/admin/**`

Nothing else in the app imports from either folder. No existing table's
pre-existing RLS policies, `is_curator_or_admin()`, `join_requests`, or any
notification trigger was modified.

## Setup (one-time)

1. Apply the migrations (already applied directly to the Supabase project as
   of this note — confirm both are present in your local
   `supabase/migrations/` folder too, or pull them down with the Supabase
   CLI so your migration history stays in sync):
   - `20260907095600_admin_content_seeder_v1.sql`
   - `20260907103000_allow_editorial_seeded_ideas.sql`
2. Grant admin to your own account (already done for
   `saviourben177@gmail.com`, `role = 'admin'`, as of this note):
   ```sql
   update public.profiles set role = 'admin' where id = '<your-uuid>';
   ```
3. Visit `/admin`.

## What each tool does

- **Businesses / Idea Library** (`/admin/businesses`, `/admin/idea-library`):
  single-record create/edit with validation, plus CSV/JSON bulk import with
  a preview step (nothing is written until you confirm). For large one-off
  batches, Supabase's own Table Editor CSV import against these tables works
  too, under the same RLS — use whichever is faster for the task.
- **Teams** (`/admin/teams`): creates an idea with
  `looking_for_collaborators = true` plus its open `idea_roles`. It does
  **not** create members or simulate join requests — see the comment block
  at the top of `src/lib/actions/admin/teams.ts` for why (join_requests has
  live notification + push-notification triggers; faking membership there
  would send real notifications for things that didn't happen). Real users
  fill these roles through the existing Team Finder flow, unmodified.
- **Team ownership**: a seeded team's `user_id` (owner) can be either your
  own admin account or the `@Aza` editorial profile — nothing else. This is
  enforced by RLS (`ideas_editorial_seed_insert`), not just app logic, so
  attempting to seed an idea owned by some other arbitrary user is rejected
  by Postgres. The team form defaults the owner field to `@Aza`'s profile id.

## Audit trail

Every create/update/delete/bulk_import through this tool writes one row to
`admin_content_log` (visible on `/admin`'s dashboard). Writes go through the
`log_admin_action()` function only — there is no direct INSERT policy on
that table for any role, so it can't be written to except through actions
in this tool.

## Removing this entirely

When you're done seeding (or adopting a different CMS):

```sql
drop policy businesses_editorial_write on public.businesses;
drop policy businesses_editorial_update on public.businesses;
drop policy businesses_editorial_delete on public.businesses;
drop policy ideas_editorial_seed_insert on public.ideas;
drop function public.log_admin_action(text, text, uuid, text);
drop table public.admin_content_log;
```

```bash
rm -rf src/app/admin src/lib/actions/admin
```

That's it. `businesses` and `idea_library` keep their pre-existing RLS
(curator/admin write, public read) exactly as before this tool existed.
Team Finder, `join_requests`, and all notification triggers were never
touched, so nothing about them changes. Seeded content itself (the rows
already inserted) stays in the database — only the tooling goes away.
