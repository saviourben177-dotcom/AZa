import { NextRequest, NextResponse } from "next/server";
import { runOpportunityIngest } from "@/lib/ingest/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/ingest-opportunities
 *
 * Vercel Cron entry point (see vercel.json — runs daily at 05:00 UTC).
 * Vercel Cron always calls with GET and its own automatic
 * `Authorization: Bearer $CRON_SECRET` header — set CRON_SECRET in the
 * project's environment variables (Vercel sets/validates this
 * automatically when a crons config is present; see
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs).
 *
 * For a manually-triggered run (e.g. a curator "Refresh opportunities"
 * button), use POST /api/ingest/opportunities instead.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runOpportunityIngest();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
