import { createClient as createAdminClient } from "@supabase/supabase-js";
import { fetchAllLiveOpportunities, flagsRestrictiveEligibility } from "@/lib/ingest/sources";

// The editorial identity (@Aza) that owns all curated/ingested content —
// same profile used for manually-added opportunities. See profiles table,
// role='editorial'.
const EDITORIAL_PROFILE_ID = "1915a93c-0c87-4d35-b4d0-917dcf16f6cc";

export interface IngestRunResult {
  ok: boolean;
  fetched?: Awaited<ReturnType<typeof fetchAllLiveOpportunities>>["summary"];
  upserted: number;
  expiredRemoved: number;
  error?: string;
}

/**
 * Runs one full ingest pass: fetch all live external sources, upsert into
 * `opportunities` keyed on `source_ref`, then sweep stale ingested rows
 * (real deadline passed, or — for rows with no real deadline — the internal
 * expires_at housekeeping date passed). Shared by both trigger paths
 * (manual/curator POST and Vercel Cron GET) so the actual ingest logic
 * exists exactly once.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — there's no logged-in
 * user in a cron context).
 */
export async function runOpportunityIngest(): Promise<IngestRunResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[ingest] SUPABASE_SERVICE_ROLE_KEY is not set — cannot run ingest.");
    return { ok: false, upserted: 0, expiredRemoved: 0, error: "Server misconfigured." };
  }

  const supabase = createAdminClient(supabaseUrl, serviceRoleKey);

  const { rows, summary } = await fetchAllLiveOpportunities();

  let upserted = 0;
  let upsertError: string | undefined;

  if (rows.length > 0) {
    const payload = rows.map((r) => ({
      source_ref: r.source_ref,
      title: r.title,
      org: r.org,
      category: r.category,
      description: r.description,
      eligibility: r.eligibility,
      deadline: r.deadline,
      expires_at: r.expires_at,
      apply_url: r.apply_url,
      location: r.location,
      remote: r.remote,
      tags: r.tags,
      // Ingested rows have no fixed geography — without this, they never
      // matched Nearby for any user with a region set, since null never
      // matches the Nationwide/Worldwide sentinels. See getNearbyQueue().
      region: "Worldwide",
      curator_verified: false,
      created_by: EDITORIAL_PROFILE_ID,
      job_type: r.job_type,
      paid: r.paid,
      salary_range: r.salary_range,
      // Best-effort hint only (see flagsRestrictiveEligibility in
      // sources.ts) — checked against the row's own description/location/
      // eligibility text, never used to drop the row. Surfaced in the UI
      // as a "check eligibility" note, not a per-country filter, since no
      // source here reliably states which countries are excluded.
      eligibility_flag: flagsRestrictiveEligibility(
        [r.description, r.location, r.eligibility].filter(Boolean).join(" ")
      ),
      updated_at: new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from("opportunities")
      .upsert(payload, { onConflict: "source_ref", count: "exact" });

    if (error) {
      console.error("[ingest] upsert failed:", error.message);
      upsertError = error.message;
    } else {
      upserted = count ?? payload.length;
    }
  }

  // Sweep stale ingested rows (source_ref not null). Hand-curated rows
  // (source_ref IS NULL) are never touched by this, regardless of their
  // deadline — a curator-entered past deadline is real data, not staleness,
  // and deleting it isn't this sweep's job.
  //
  // Two independent reasons an ingested row counts as stale:
  //   - its real `deadline` has passed (rows that DID get a real deadline
  //     from their source, e.g. Himalayas with expiryDate, or Grant Desk's
  //     parsed RSS deadline), or
  //   - its internal `expires_at` housekeeping date has passed (rows with
  //     no real deadline at all — see sources.ts — which would otherwise
  //     sit in the table forever since they have no deadline to go by).
  // Never the fabricated-deadline shortcut the old code used, which
  // conflated the two and surfaced the housekeeping date to users.
  const todayStr = new Date().toISOString().slice(0, 10);
  let expiredRemoved = 0;
  const { error: sweepErr, count: sweepCount } = await supabase
    .from("opportunities")
    .delete({ count: "exact" })
    .not("source_ref", "is", null)
    .or(`deadline.lt.${todayStr},expires_at.lt.${todayStr}`);
  if (sweepErr) {
    console.error("[ingest] expiry sweep failed:", sweepErr.message);
  } else {
    expiredRemoved = sweepCount ?? 0;
  }

  return {
    ok: !upsertError,
    fetched: summary,
    upserted,
    expiredRemoved,
    ...(upsertError ? { error: upsertError } : {}),
  };
}
