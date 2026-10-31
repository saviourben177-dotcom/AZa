-- Expands the `skills` taxonomy with common job-posting requirement terms
-- that the AI job-fit tool (analyzeOpportunityMatch, src/lib/groq.ts ->
-- opportunity_match_analyses.missing_requirements) is likely to surface but
-- has no matching skill to link to today. Checked the live skills table
-- directly (Oct 2026) before writing this to avoid duplicating existing
-- rows (e.g. "Web Development" / "JavaScript / Web Development" and
-- "Carpentry Basics" / "Carpentry & Woodwork" already both exist — left
-- as-is, not touched by this migration).
--
-- Additive only, same on-conflict-do-nothing pattern as the original seed
-- (20261021190936_course_ingest_and_skills_seed.sql).

insert into public.skills (name, category) values
  -- coding — specific tools that show up in job postings but weren't
  -- broken out from the broader "Web Development"/"Python Programming" rows
  ('SQL & Databases', 'coding'),
  ('Git & Version Control', 'coding'),
  ('API Integration', 'coding'),
  -- business — specific tools, not just the broad category rows that exist
  ('Excel & Spreadsheets', 'business'),
  ('Google Analytics', 'business'),
  ('Customer Support', 'business'),
  ('Sales Fundamentals', 'business'),
  ('Data Analysis', 'business'),
  -- design — one level more specific than the existing Graphic Design/UI-UX rows
  ('Canva Design', 'design'),
  ('Copywriting', 'business'),
  -- ai — a practical complement to the existing Prompt Engineering/ML rows
  ('AI-Assisted Writing', 'ai')
on conflict (name) do nothing;
