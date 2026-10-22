-- Featured opportunities are a small, hand-maintained list (Mercor, Ethos,
-- micro1, Outlier, Surge AI, Handshake AI) shown in their own section,
-- separate from the main API-sourced `opportunities` pipeline. They are
-- not real rows in `opportunities` — each is identified by a fixed slug
-- defined in application code (see src/lib/aza/featured-opportunities.ts)
-- — so `saved_opportunities.opportunity_id`, which has a hard foreign key
-- to `opportunities`, cannot be reused for them without polluting the main
-- feed/search/discover pipeline with fake rows. These two tables mirror
-- the shape of `saved_opportunities` / its status tracking, but keyed by
-- a plain text slug instead.

create table if not exists public.featured_opportunity_status (
  user_id uuid not null references public.profiles(id) on delete cascade,
  featured_id text not null,
  status public.application_status not null default 'saved',
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, featured_id)
);

alter table public.featured_opportunity_status enable row level security;

create policy featured_opportunity_status_select_own
  on public.featured_opportunity_status for select
  to authenticated
  using (user_id = auth.uid());

create policy featured_opportunity_status_insert_own
  on public.featured_opportunity_status for insert
  to authenticated
  with check (user_id = auth.uid());

create policy featured_opportunity_status_update_own
  on public.featured_opportunity_status for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy featured_opportunity_status_delete_own
  on public.featured_opportunity_status for delete
  to authenticated
  using (user_id = auth.uid());

-- Click log: one row per tap on a Featured "Apply"/"Join" button, written
-- right before the external link opens. user_id is nullable so a logged-
-- out visitor's click (if the section is ever shown pre-login) still logs
-- with source='featured' and a null user rather than being dropped.
create table if not exists public.featured_opportunity_clicks (
  id uuid primary key default gen_random_uuid(),
  featured_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  source text not null default 'featured',
  created_at timestamptz not null default now()
);

alter table public.featured_opportunity_clicks enable row level security;

-- Insert-only from the client: anyone (including anon, in case the
-- section is ever shown pre-login) can log a click, but no one can read,
-- update, or delete the log via the API — it's write-only telemetry.
create policy featured_opportunity_clicks_insert_any
  on public.featured_opportunity_clicks for insert
  to authenticated, anon
  with check (true);

create index if not exists featured_opportunity_clicks_featured_id_idx
  on public.featured_opportunity_clicks (featured_id);

create index if not exists featured_opportunity_clicks_created_at_idx
  on public.featured_opportunity_clicks (created_at desc);
