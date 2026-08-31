import { createClient as createAdminClient } from "@supabase/supabase-js";
import { fetchAllLiveOpportunities } from "@/lib/ingest/sources";

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
 * `opportunities` keyed on `source_ref`, then sweep expired ingested rows
 * (deadline passed). Shared by both trigger paths (manual/curator POST and
 * Vercel Cron GET) so the actual ingest logic exists exactly once.
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
      apply_url: r.apply_url,
      location: r.location,
      remote: r.remote,
      tags: r.tags,
      curator_verified: false,
      created_by: EDITORIAL_PROFILE_ID,
      job_type: r.job_type,
      paid: r.paid,
      salary_range: r.salary_range,
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

  // The 92-day rule: any ingested row (source_ref not null) whose deadline
  // has already passed gets swept. Hand-curated rows (source_ref IS NULL)
  // are never touched.
  let expiredRemoved = 0;
  const { error: sweepErr, count: sweepCount } = await supabase
    .from("opportunities")
    .delete({ count: "exact" })
    .not("source_ref", "is", null)
    .lt("deadline", new Date().toISOString().slice(0, 10));
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
