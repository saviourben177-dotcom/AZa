-- bump_skill_path_streak(p_user_id, p_path_id) is SECURITY DEFINER and takes
-- p_user_id directly from the caller with no auth.uid() check inside the
-- function body. It is meant to be called only internally, from within
-- complete_skill_checkpoint() (which derives v_user_id from auth.uid() and
-- passes it in), but because it is a plain SQL-callable function it was also
-- directly reachable by any client via /rest/v1/rpc/bump_skill_path_streak.
-- That let any authenticated (or anonymous) caller pass an arbitrary
-- p_user_id/p_path_id and overwrite another user's streak counters
-- (current_streak_days, longest_streak_days, active_days_count,
-- last_activity_at), which rating_consistency is later computed from in
-- complete_skill_checkpoint. Revoking EXECUTE from PUBLIC/anon/authenticated
-- removes the direct RPC path; complete_skill_checkpoint can still call it
-- because a SECURITY DEFINER function executes as its owner regardless of
-- the grants on the function itself.
revoke execute on function public.bump_skill_path_streak(uuid, uuid) from public;
revoke execute on function public.bump_skill_path_streak(uuid, uuid) from anon;
revoke execute on function public.bump_skill_path_streak(uuid, uuid) from authenticated;
