import { NextRequest, NextResponse } from "next/server";
import { runMetadataIngestPhase, runExtractionBatchPhase } from "@/lib/ingest/run-open-content";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // only takes effect on Pro/Enterprise — see run-open-content.ts

/**
 * GET /api/cron/ingest-courses
 *
 * Vercel Cron entry point (see vercel.json — runs daily at 05:15 UTC).
 * Vercel Cron always calls with GET and its own automatic
 * `Authorization: Bearer $CRON_SECRET` header.
 *
 * Runs the metadata phase (fetch DOAB/OTL listings, upsert as
 * reader_mode='pending' — fast, no PDF downloads) followed by ONE
 * extraction batch (a handful of pending rows get downloaded and
 * pdf.js-extracted). Both phases are individually bounded, well under
 * even Vercel's Hobby-plan 10s cap — see run-open-content.ts for why
 * this is split instead of one long pass. A large backlog of pending
 * rows clears gradually, one batch per day; for a faster initial catch-up
 * after first deploying, POST /api/ingest/courses?phase=extract
 * repeatedly by hand.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const metadata = await runMetadataIngestPhase();
  const extraction = await runExtractionBatchPhase();

  return NextResponse.json({ ok: metadata.ok && extraction.ok, metadata, extraction });
}
