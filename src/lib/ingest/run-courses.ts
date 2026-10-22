import { createClient as createAdminClient } from "@supabase/supabase-js";
import { fetchAllLiveCourses } from "@/lib/ingest/course-sources";

// Same editorial identity used by the opportunities ingest (see
// EDITORIAL_PROFILE_ID in run.ts) — one shared curated/ingested-content
// owner across the app, profiles.role='editorial'.
const EDITORIAL_PROFILE_ID = "1915a93c-0c87-4d35-b4d0-917dcf16f6cc";

export interface CourseIngestRunResult {
  ok: boolean;
  fetched?: Awaited<ReturnType<typeof fetchAllLiveCourses>>["summary"];
  upserted: number;
  skippedUnresolvedSkill: number;
  error?: string;
}

/**
 * Runs one full course-ingest pass: fetch all live external sources,
 * resolve each row's skill_name to a skills.id (skill_resources.skill_id
 * is a required FK — unlike opportunities, there's no flat category enum
 * to upsert against directly), then upsert into `skill_resources` keyed on
 * `source_ref`. Shared by both trigger paths (manual/curator POST and
 * Vercel Cron GET), same split as run.ts/the opportunities ingest.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — no logged-in user in
 * a cron context).
 *
 * No expiry sweep here (courses don't have a deadline column the way
 * opportunities do) — re-running just upserts the same rows, which is the
 * desired steady state for a content feed like this.
 */
export async function runCourseIngest(): Promise<CourseIngestRunResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[course-ingest] SUPABASE_SERVICE_ROLE_KEY is not set — cannot run ingest.");
    return { ok: false, upserted: 0, skippedUnresolvedSkill: 0, error: "Server misconfigured." };
  }

  const supabase = createAdminClient(supabaseUrl, serviceRoleKey);

  const { rows, summary } = await fetchAllLiveCourses();

  // Resolve skill_name -> skill_id once, for every distinct name seen.
  const distinctNames = Array.from(new Set(rows.map((r) => r.skill_name)));
  const { data: skillRows, error: skillsErr } = await supabase
    .from("skills")
    .select("id, name")
    .in("name", distinctNames);

  if (skillsErr) {
    console.error("[course-ingest] skills lookup failed:", skillsErr.message);
    return { ok: false, upserted: 0, skippedUnresolvedSkill: 0, error: skillsErr.message };
  }

  const skillIdByName = new Map((skillRows ?? []).map((s) => [s.name, s.id as string]));

  let skippedUnresolvedSkill = 0;
  const payload = rows.flatMap((r) => {
    const skillId = skillIdByName.get(r.skill_name);
    if (!skillId) {
      // Should not happen in steady state (skill_name values are drawn
      // from the seed migration's fixed set) but guard anyway rather than
      // insert a row that violates the skill_id FK and fails the batch.
      skippedUnresolvedSkill += 1;
      console.error(`[course-ingest] no skill found for name "${r.skill_name}" — skipping row ${r.source_ref}`);
      return [];
    }
    return [
      {
        source_ref: r.source_ref,
        skill_id: skillId,
        title: r.title,
        provider: r.provider,
        url: r.url,
        resource_type: r.resource_type,
        level: r.level,
        duration_hours: r.duration_hours,
        is_free: r.is_free,
        curator_verified: false,
        created_by: EDITORIAL_PROFILE_ID,
      },
    ];
  });

  let upserted = 0;
  let upsertError: string | undefined;

  if (payload.length > 0) {
    const { error, count } = await supabase
      .from("skill_resources")
      .upsert(payload, { onConflict: "source_ref", count: "exact" });

    if (error) {
      console.error("[course-ingest] upsert failed:", error.message);
      upsertError = error.message;
    } else {
      upserted = count ?? payload.length;
    }
  }

  return {
    ok: !upsertError,
    fetched: summary,
    upserted,
    skippedUnresolvedSkill,
    ...(upsertError ? { error: upsertError } : {}),
  };
}
