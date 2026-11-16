-- Dedicated, always-visible credit line for paths whose checkpoint content
-- is adapted from CC-licensed source material (OpenStax, LibreTexts,
-- Füllsack, Web Design Primer, Rutherford/Univ. of Hawai'i OER). Each of
-- these licenses is CC BY 4.0: reuse and resale are permitted, but
-- attribution to the original author/publisher is a condition of that
-- permission, not optional. A dedicated path-level field (rendered on the
-- path detail page) is more durable and more honest than burying credit
-- inside one checkpoint's body text.

alter table public.skill_paths add column source_attribution text;

comment on column public.skill_paths.source_attribution is
  'Required credit line for the CC-licensed source material this path''s content is adapted from (e.g. OpenStax, LibreTexts, Füllsack, Web Design Primer, Rutherford/Univ. of Hawai''i OER). Shown on the path detail page. Null for paths with no external source material.';
