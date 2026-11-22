-- Fix: prep_questions had RLS enabled with zero policies defined, so every
-- select from authenticated/anon was denied outright. prep_questions_public
-- is declared with security_invoker = true, meaning it runs under the
-- querying role and is therefore still subject to prep_questions' RLS, not
-- just the view's own grants. On top of that, prep_questions (unlike
-- prep_fields) was never given a base-table GRANT SELECT to
-- authenticated/anon, which security_invoker views also require. Net
-- effect: the Prep tab showed "0 questions" / "No questions available yet"
-- for every field in the app, even though prep_questions had published
-- rows. Mirrors the existing prep_fields_public_read policy + grant.

grant select on public.prep_questions to authenticated, anon;

create policy prep_questions_public_read on public.prep_questions
  for select to authenticated, anon
  using (is_published);
