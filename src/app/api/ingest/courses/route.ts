import { NextRequest, NextResponse } from "next/server";
import { runOpenContentIngest } from "@/lib/ingest/run-open-content";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/ingest/courses
 *
 * Manual trigger for a full Courses ingest run (e.g. a curator "Refresh
 * courses" button, same pattern as opportunities). Protected by a shared
 * secret in the `x-ingest-secret` header — reuses INGEST_SECRET (same env
 * var as /api/ingest/opportunities). Separate from the Vercel Cron trigger
 * at /api/cron/ingest-courses, which uses Vercel's own
 * Authorization: Bearer $CRON_SECRET mechanism.
 *
 * Sources DOAB + Open Textbook Library into the `courses` table — this
 * replaces the retired RSS-based ingest that fed `skill_resources` (see
 * the schema migration's retirement note; that table/data is untouched,
 * just no longer the thing this route writes to).
 */
export async function POST(req: NextRequest) {
  const providedSecret = req.headers.get("x-ingest-secret");
  const expectedSecret = process.env.INGEST_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runOpenContentIngest();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
