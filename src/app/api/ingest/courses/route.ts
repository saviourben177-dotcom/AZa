import { NextRequest, NextResponse } from "next/server";
import { runCourseIngest } from "@/lib/ingest/run-courses";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/ingest/courses
 *
 * Manual trigger for a full course ingest run (e.g. a curator "Refresh
 * courses" button, same pattern as opportunities). Protected by a shared
 * secret in the `x-ingest-secret` header — reuses INGEST_SECRET (same env
 * var as /api/ingest/opportunities; both are curator-triggered, server-only
 * endpoints, so one shared secret is enough rather than a second one to
 * manage). Separate from the Vercel Cron trigger at
 * /api/cron/ingest-courses, which uses Vercel's own
 * Authorization: Bearer $CRON_SECRET mechanism.
 */
export async function POST(req: NextRequest) {
  const providedSecret = req.headers.get("x-ingest-secret");
  const expectedSecret = process.env.INGEST_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runCourseIngest();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
