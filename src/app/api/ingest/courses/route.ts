import { NextRequest, NextResponse } from "next/server";
import { runMetadataIngestPhase, runExtractionBatchPhase } from "@/lib/ingest/run-open-content";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // only takes effect on Pro/Enterprise — see run-open-content.ts for why neither phase below depends on it

/**
 * POST /api/ingest/courses
 *
 * Manual trigger for the Courses ingest — split into two fast, independent
 * phases rather than one long-running pass, because Vercel's Hobby plan
 * caps actual function duration at 10s regardless of maxDuration above
 * (that setting only takes effect on Pro/Enterprise), and the original
 * single-pass version (fetch + download-and-extract every PDF) ran past
 * that and was killed mid-flight. See run-open-content.ts for the full
 * explanation.
 *
 * Pass ?phase=metadata to only fetch DOAB/OTL listings and upsert them as
 * reader_mode='pending' (fast — no PDF downloads). Pass ?phase=extract
 * (or omit — this is the default) to process one small batch of pending
 * rows into flowable/pdf_fallback/external_link. Call extract repeatedly
 * — the response's remainingPending tells you how many batches are left.
 */
export async function POST(req: NextRequest) {
  const providedSecret = req.headers.get("x-ingest-secret");
  const expectedSecret = process.env.INGEST_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const phase = req.nextUrl.searchParams.get("phase") ?? "extract";

  if (phase === "metadata") {
    const result = await runMetadataIngestPhase();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  }

  const result = await runExtractionBatchPhase();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
