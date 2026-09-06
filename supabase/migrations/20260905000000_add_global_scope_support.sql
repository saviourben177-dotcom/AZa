-- Add Nigeria/Global scope support.
--
-- Design: keep the ONE existing region-matching mechanism, don't build a
-- second parallel one. Nigeria users keep behaving exactly as before
-- (state + region-as-zone, unchanged). Global users store their country
-- name directly in the same free-text `region` column that already holds
-- zone names for Nigeria -- see src/lib/actions/onboarding.ts. `scope` is
-- the one genuinely new concept: it disambiguates which shape `region`
-- holds for a given profile and drives which onboarding UI to show.

alter table public.profiles
  add column scope text not null default 'nigeria'
  check (scope in ('nigeria', 'global'));

comment on column public.profiles.scope is
  'Which onboarding location path the user took. ''nigeria'' -> state/region hold a Nigerian state + geopolitical zone as before. ''global'' -> state is null and region holds a country name directly (same free-text column, broader value -- see src/lib/actions/onboarding.ts). Defaults to nigeria so every existing user is unaffected.';

-- Business Hub has its own separate Nigeria-only pattern (matches on
-- `state` directly) with no region-equivalent column at all. Add one,
-- mirroring opportunities.region exactly, so Business Hub can adopt the
-- same zone/country/Nationwide/Worldwide matching pattern used everywhere
-- else instead of inventing a second one.
alter table public.businesses
  add column region text;

comment on column public.businesses.region is
  'General-purpose matching field mirroring opportunities.region: a Nigerian geopolitical zone (derived from state), a country name (Global-scope businesses), or the literal sentinels ''Nationwide'' / ''Worldwide''. Nullable -- no existing rows to backfill (table was empty at migration time).';

-- Marketplace/Prices are a reference/display conversion tool (no real
-- money moves through them), currently Naira-only. Add a currency column
-- next to the existing price_kobo minor-unit amount so a row can name
-- which currency that amount is actually in. Backfill existing rows to
-- 'ngn' since every row so far was entered as Naira.
alter table public.prices
  add column currency text not null default 'ngn';

alter table public.marketplace_listings
  add column currency text not null default 'ngn';

comment on column public.prices.currency is
  'Lowercase currency code for price_kobo (the column keeps its Naira-derived name, but now holds the minor-unit amount in whichever currency this column names). Reference/display conversion only, same as before -- no real money moves through this table. Not DB-constrained to a fixed list, matching how currency-tool.tsx already treats the currency universe as open-ended.';

comment on column public.marketplace_listings.currency is
  'Lowercase currency code for price_kobo -- same generalization as prices.currency. Reference/display conversion only -- no real money moves through this table.';
