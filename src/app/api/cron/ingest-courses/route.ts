import { NextRequest, NextResponse } from "next/server";
import { runCourseIngest } from "@/lib/ingest/run-courses";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/ingest-courses
 *
 * Vercel Cron entry point (see vercel.json — runs daily at 05:15 UTC, just
 * after the opportunities ingest at 05:00, so the two never race on cold
 * start). Vercel Cron always calls with GET and its own automatic
 * `Authorization: Bearer $CRON_SECRET` header — same CRON_SECRET env var
 * Vercel already validates for ingest-opportunities.
 *
 * For a manually-triggered run (e.g. a curator "Refresh courses" button),
 * use POST /api/ingest/courses instead.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runCourseIngest();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
