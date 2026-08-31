import { NextRequest, NextResponse } from "next/server";
import { runOpportunityIngest } from "@/lib/ingest/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/ingest/opportunities
 *
 * Manual trigger for a full opportunity ingest run (e.g. a curator "Refresh
 * opportunities" button). Protected by a shared secret in the
 * `x-ingest-secret` header — this is separate from the Vercel Cron trigger
 * at /api/cron/ingest-opportunities, which uses Vercel's own
 * Authorization: Bearer $CRON_SECRET mechanism (Vercel Cron only ever sends
 * GET requests, so it cannot call this route directly).
 */
export async function POST(req: NextRequest) {
  const providedSecret = req.headers.get("x-ingest-secret");
  const expectedSecret = process.env.INGEST_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runOpportunityIngest();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
