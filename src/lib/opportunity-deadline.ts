/**
 * True if an opportunity is still open to apply to: no deadline set (an
 * ongoing/ rolling opportunity), or a deadline that's today or later.
 * `deadline` is a plain Postgres `date` column (not timestamptz), so
 * comparing it against the current date is exact — no timezone edge
 * cases, and "due today" still counts as open (matches how
 * DeadlinePill/daysUntil treat day 0 as urgent-but-not-closed, not
 * already-closed).
 *
 * Applied as a plain JS `.filter()` after the Supabase fetch, deliberately
 * NOT as a DB-side `.or()` clause: several of this predicate's call sites
 * already have their own `.or()` in the query (search terms, region
 * matching), and chaining a second `.or()` for deadline would rely on
 * PostgREST's multi-param AND behavior — logically sound, but not
 * something verifiable end-to-end from here without a live app to test
 * against. A post-fetch filter is unambiguous and easy to verify by
 * reading, at the cost of transferring a handful of extra rows before
 * discarding them — a fine trade for a table this size.
 *
 * Six separate read paths (Discover's 4 queues, Home's search and
 * recommended feeds, global search, the funding list, and the growth
 * assistant) had each independently forgotten to exclude expired
 * opportunities — this file exists so a 7th place can't make the same
 * mistake silently. Admin/curator views and single-item-by-id lookups
 * (edit forms, the opportunity detail page, CV generation) are the
 * deliberate exception: they need to see a specific or every opportunity
 * regardless of expiry, and should NOT use this filter.
 */
export function isOpenOpportunity(o: { deadline: string | null }): boolean {
  if (!o.deadline) return true;
  const today = new Date().toISOString().slice(0, 10);
  return o.deadline >= today;
}
