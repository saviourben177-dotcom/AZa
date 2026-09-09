-- EXECUTE on public.is_curator_or_admin() was missing for authenticated/anon.
-- Postgres checks function-level privileges for ALL RLS policies applicable
-- to a role on a table during planning, not just the policy that matches the
-- row being written. Since storage.objects has curator-gated policies on the
-- business-logos bucket that call is_curator_or_admin(), any authenticated
-- write to storage.objects (including unrelated buckets like avatars) failed
-- with "permission denied for function is_curator_or_admin" once the grant
-- was missing.
grant execute on function public.is_curator_or_admin() to authenticated, anon;
