-- Adds automated-ingest support to skill_resources (mirrors
-- opportunities.source_ref) and seeds the skills taxonomy, which was
-- empty (0 rows) despite src/lib/skill-visuals.ts documenting 6 known
-- categories and code elsewhere assuming skills exist. Without this,
-- /growth/courses and /growth/skills have nothing to show or attach to —
-- skill_resources.skill_id is a required FK, so skill_resources cannot be
-- populated until skills has rows.

-- 1. source_ref: stable external-source key for upsert dedup, same pattern
-- as opportunities.source_ref. NULL for hand-curated rows.
alter table public.skill_resources
  add column if not exists source_ref text unique;

comment on column public.skill_resources.source_ref is
  'Stable external-source key (e.g. "fcc-yt-abc123") for upsert dedup on automated ingestion. NULL for manually curated rows.';

-- 2. Seed skills — one row per (category, skill name). Categories match
-- SKILL_CATEGORY_ORDER / SKILL_CATEGORY_LABEL in src/lib/skill-visuals.ts
-- exactly (ai, business, coding, design, trades_diy, trading). Names are
-- unique per the table's existing unique constraint.
insert into public.skills (name, category) values
  ('Web Development', 'coding'),
  ('Python Programming', 'coding'),
  ('JavaScript', 'coding'),
  ('Mobile App Development', 'coding'),
  ('Data Structures & Algorithms', 'coding'),
  ('Cybersecurity Basics', 'coding'),
  ('UI/UX Design', 'design'),
  ('Graphic Design', 'design'),
  ('Figma', 'design'),
  ('Video Editing', 'design'),
  ('Prompt Engineering', 'ai'),
  ('Machine Learning Basics', 'ai'),
  ('AI Tools for Productivity', 'ai'),
  ('Digital Marketing', 'business'),
  ('Business Writing', 'business'),
  ('Financial Literacy', 'business'),
  ('Project Management', 'business'),
  ('Entrepreneurship Fundamentals', 'business'),
  ('Public Speaking', 'business'),
  ('Stock Market Basics', 'trading'),
  ('Cryptocurrency Basics', 'trading'),
  ('Forex Trading Fundamentals', 'trading'),
  ('Carpentry Basics', 'trades_diy'),
  ('Electrical Wiring Basics', 'trades_diy'),
  ('Plumbing Basics', 'trades_diy')
on conflict (name) do nothing;
