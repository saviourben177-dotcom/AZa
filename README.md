# Aza

Opportunity-discovery, growth, and business platform for Nigerians. Mobile-first, built with Next.js 14 (App Router), Tailwind CSS, and Supabase.

## Stack

- **Frontend/Backend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Database/Auth/Storage**: Supabase (project ref: `saongnctrioxuvdcsmbw`, region eu-central-1)
- **Deploy target**: Vercel

## Environment variables

Required in `.env.local` (not committed — see `.gitignore`) and in Vercel's project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://saongnctrioxuvdcsmbw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key from Supabase dashboard>
```

## Structure

- `src/app/` — routes (App Router). Five bottom-nav tabs: Home (`/`), Discover (`/discover`), Growth Hub (`/growth`), Business Hub (`/businesses`), Profile (`/profile`).
- `src/app/curator/` — curator/admin dashboard, role-gated via `profiles.role`.
- `src/app/onboarding/` — 12-step (dynamic, status-branched) personalization quiz.
- `src/lib/supabase/` — browser/server/middleware Supabase clients.
- `src/lib/actions/` — server actions (mutations) per feature area.
- `src/lib/personalization.ts` — hard-filter + soft-rank + fallback engine driving Home/Discover.
- `src/lib/types.ts` — shared TypeScript types matching the DB schema exactly.

## Database

All schema/RLS lives in Supabase, applied via migrations (not checked into this repo as `.sql` files — managed directly against the live project). Key tables: `profiles`, `opportunities`, `saved_opportunities`, `dismissed_opportunities`, `businesses`, `skills`, `skill_resources`, `user_skills`, `ideas`, `idea_upvotes`, `business_tools`, `incubators`, `marketplace_listings`, `prices` (shelved feature, table retained).

RLS pattern: public read on content tables, curator/admin-only write (checked via `is_curator_or_admin()`), owner-only on personal data (saved/dismissed opportunities, ideas, marketplace listings).

**No one can self-promote to curator.** To grant curator/admin role after a real signup:
```sql
update profiles set role = 'curator' where id = '<user-uuid>';
```

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Status

Core features (Phases 1–3 of the build roadmap) are complete: onboarding, Home, Discover, Growth Hub, Business Hub, Profile, full curator dashboard. Logic/integrity testing pass complete (RLS verified live, personalization engine unit-tested, broken-link check clean). Not yet done: real-device/visual testing, performance pass, PWA packaging, Play Store packaging, production release.

**Known deferred items:**
- Prices tab: shelved by product decision, not removed from schema.
- Team Finder (Business Hub): intentionally unbuilt, shown as a disabled "Soon" card.
- Achievements/streaks/certifications: explicitly skipped for v1.
