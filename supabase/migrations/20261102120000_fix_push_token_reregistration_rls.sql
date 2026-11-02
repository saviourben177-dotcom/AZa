-- Fix: device re-registration (reinstall / account switch) fails with RLS 403
--
-- Root cause: the client upserts device_push_tokens with onConflict: "fcm_token".
-- The existing "for all" policy's USING clause is evaluated against the
-- EXISTING row on the conflict-update path. If a token string is reused
-- (reinstall, device re-issued the same FCM token, or account switch on the
-- same device) and the existing row belongs to a different user_id, the
-- UPDATE half of the upsert is blocked by RLS before it ever runs.
--
-- Fix: keep RLS exactly as strict (users still cannot read/delete another
-- user's token rows), but add a SECURITY DEFINER function that performs the
-- "claim this token for the current auth.uid()" operation explicitly and
-- safely, bypassing the USING check only for this one, narrow, intentional
-- reassignment — which mirrors real-world semantics: a physical device's
-- FCM token belongs to whichever account is currently signed in on it.

create or replace function public.claim_push_token(
  p_fcm_token text,
  p_platform text default 'android'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.device_push_tokens (user_id, fcm_token, platform, last_seen_at)
  values (auth.uid(), p_fcm_token, p_platform, now())
  on conflict (fcm_token)
  do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    last_seen_at = excluded.last_seen_at;
end;
$$;

-- Only authenticated users can call it, and only to claim a token for
-- themselves (auth.uid() is taken server-side, never from client input) —
-- so this does not let anyone read or delete another user's rows, and does
-- not change the existing "Users manage own push tokens" policy at all.
revoke all on function public.claim_push_token(text, text) from public;
grant execute on function public.claim_push_token(text, text) to authenticated;
