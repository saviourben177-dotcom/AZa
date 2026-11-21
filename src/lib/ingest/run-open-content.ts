import { createClient as createAdminClient } from "@supabase/supabase-js";
import { fetchAllOpenContent, type OpenContentIngestRow, type QueryDiagnostic } from "@/lib/ingest/open-content-sources";
import { extractPdfForReader } from "@/lib/ingest/pdf-extract";

// Vercel's Hobby plan silently caps serverless function duration at 10s
// regardless of a route's own `maxDuration` setting (that setting only
// takes effect on Pro/Enterprise) — the original single-pass version of
// this ingest (fetch DOAB+OTL, then download and pdf.js-extract every
// matched title, all in one request) ran well past that on a real
// account and was killed mid-flight, writing nothing and returning a
// truncated/malformed response. Restructured into two short, independent
// phases so neither one can blow a 10s budget, regardless of plan:
//
//   Phase 1 — runMetadataIngestPhase(): fetch DOAB + OTL JSON only (no
//   PDF downloads), upsert rows with reader_mode='pending'. Just a
//   handful of JSON fetches — comfortably fast.
//
//   Phase 2 — runExtractionBatchPhase(): pick a small batch of 'pending'
//   rows, download + pdf.js-extract each one, update reader_mode in
//   place. Called repeatedly (same cron, every day) until the backlog of
//   'pending' rows clears — each call only processes BATCH_SIZE rows, so
//   it always finishes well inside 10s even on a slow PDF.
//
// The public API below keeps the original runOpenContentIngest() name
// available too, calling both phases back to back — fine for a manual
// trigger with a short catalog, but the route itself now defaults to
// running them separately (see the route files) so a normal day's
// ingest never risks a timeout.

const EXTRACTION_BATCH_SIZE = 8;

export interface MetadataPhaseResult {
  ok: boolean;
  fetched?: Awaited<ReturnType<typeof fetchAllOpenContent>>["summary"];
  upserted: number;
  error?: string;
  // Per-query detail (HTTP status, response shape, raw vs. accepted
  // counts, sample rejection reasons) — included whenever fetched.total
  // is 0 so a single curl call shows exactly what each live request to
  // DOAB/Open Textbook Library actually did, without needing server log
  // access. Omitted on a normal non-zero run to keep the response small.
  diagnostics?: QueryDiagnostic[];
}

export interface ExtractionBatchResult {
  ok: boolean;
  processed: number;
  remainingPending: number;
  extracted: { flowable: number; pdf_fallback: number; external_link: number; failed: number };
  error?: string;
}

export interface OpenContentIngestRunResult {
  ok: boolean;
  metadata: MetadataPhaseResult;
  extraction: ExtractionBatchResult;
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createAdminClient(supabaseUrl, serviceRoleKey);
}

/**
 * Phase 1: fetch DOAB + Open Textbook Library metadata (JSON only, no PDF
 * downloads) and upsert into `courses` with reader_mode='pending'. Safe
 * to call repeatedly — upsert on (source, source_ref) means a title
 * already fully processed by Phase 2 (reader_mode moved past 'pending')
 * is NOT reset back to pending by a later Phase 1 run, since this never
 * touches reader_mode on conflict (see onConflict below).
 */
export async function runMetadataIngestPhase(): Promise<MetadataPhaseResult> {
  const supabase = getAdminClient();
  if (!supabase) {
    console.error("[open-content-ingest] SUPABASE_SERVICE_ROLE_KEY is not set — cannot run ingest.");
    return { ok: false, upserted: 0, error: "Server misconfigured." };
  }

  const { rows, summary, diagnostics } = await fetchAllOpenContent();

  if (rows.length === 0) {
    // Always include diagnostics on a zero-row result — this is the
    // unexpected case, and the whole point of carrying diagnostics at
    // all is to make a zero-row response self-explanatory from curl
    // output alone.
    return { ok: true, fetched: summary, upserted: 0, diagnostics };
  }

  const payload = rows.map((row) => metadataRow(row));

  // ignoreDuplicates: true — a title already upserted earlier (by this
  // phase or fully processed by Phase 2) is left completely untouched,
  // not overwritten back to 'pending'. A brand-new title not seen before
  // still inserts normally.
  const { error, count } = await supabase
    .from("courses")
    .upsert(payload, { onConflict: "source,source_ref", ignoreDuplicates: true, count: "exact" });

  if (error) {
    console.error("[open-content-ingest] metadata upsert failed:", error.message);
    return { ok: false, fetched: summary, upserted: 0, error: error.message };
  }

  return { ok: true, fetched: summary, upserted: count ?? 0 };
}

function metadataRow(row: OpenContentIngestRow): Record<string, unknown> {
  return {
    source: row.source,
    source_ref: row.source_ref,
    title: row.title,
    author: row.author,
    summary: row.summary,
    category: row.category,
    license: row.license,
    source_url: row.source_url,
    pdf_url: row.pdf_url,
    is_coin_gated: false,
    unlock_cost: 25,
    is_published: true,
    reader_mode: "pending",
    flowable_content: null,
    ingested_at: new Date().toISOString(),
  };
}

/**
 * Phase 2: picks up to EXTRACTION_BATCH_SIZE rows still at
 * reader_mode='pending', downloads and pdf.js-extracts each one (or
 * routes to external_link if there's no pdf_url at all), and updates
 * each row individually. Deliberately small and bounded — call this
 * repeatedly (the cron already runs daily; it's safe to also trigger it
 * manually several times in a row) until remainingPending reaches 0.
 */
export async function runExtractionBatchPhase(): Promise<ExtractionBatchResult> {
  const supabase = getAdminClient();
  if (!supabase) {
    console.error("[open-content-ingest] SUPABASE_SERVICE_ROLE_KEY is not set — cannot run extraction batch.");
    return {
      ok: false,
      processed: 0,
      remainingPending: 0,
      extracted: { flowable: 0, pdf_fallback: 0, external_link: 0, failed: 0 },
      error: "Server misconfigured.",
    };
  }

  const { data: batch, error: fetchError } = await supabase
    .from("courses")
    .select("id, pdf_url, source_url, source_ref")
    .eq("reader_mode", "pending")
    .limit(EXTRACTION_BATCH_SIZE);

  if (fetchError) {
    console.error("[open-content-ingest] failed to read pending batch:", fetchError.message);
    return {
      ok: false,
      processed: 0,
      remainingPending: 0,
      extracted: { flowable: 0, pdf_fallback: 0, external_link: 0, failed: 0 },
      error: fetchError.message,
    };
  }

  const extracted = { flowable: 0, pdf_fallback: 0, external_link: 0, failed: 0 };

  if (batch && batch.length > 0) {
    // Small, bounded concurrency within this already-small batch —
    // still worth not doing all 8 at once given each one downloads a
    // whole PDF and runs pdf.js over it.
    const CONCURRENCY = 3;
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const slice = batch.slice(i, i + CONCURRENCY);
      await Promise.all(
        slice.map(async (row) => {
          const update = await extractionUpdateForRow(row.pdf_url, row.source_url);
          extracted[update.mode] += 1;
          const { error } = await supabase.from("courses").update(update.fields).eq("id", row.id);
          if (error) {
            console.error(`[open-content-ingest] failed to update row ${row.source_ref}:`, error.message);
          }
        })
      );
    }
  }

  const { count: remainingPending } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("reader_mode", "pending");

  return {
    ok: true,
    processed: batch?.length ?? 0,
    remainingPending: remainingPending ?? 0,
    extracted,
  };
}

async function extractionUpdateForRow(
  pdfUrl: string | null,
  sourceUrl: string | null
): Promise<{ fields: Record<string, unknown>; mode: "flowable" | "pdf_fallback" | "external_link" | "failed" }> {
  if (!pdfUrl) {
    return {
      fields: { reader_mode: "external_link", external_url: sourceUrl, flowable_content: null },
      mode: "external_link",
    };
  }

  const result = await extractPdfForReader(pdfUrl);

  if (!result.ok) {
    console.error(`[open-content-ingest] extraction failed: ${result.reason}`);
    return { fields: { reader_mode: "pdf_fallback", flowable_content: null }, mode: "failed" };
  }

  if (result.mode === "pdf_fallback") {
    console.error(`[open-content-ingest] falling back to pdf viewer: ${result.reason}`);
    return {
      fields: {
        reader_mode: "pdf_fallback",
        flowable_content: null,
        estimated_minutes: result.pageCount ? Math.max(5, Math.round(result.pageCount * 1.5)) : null,
      },
      mode: "pdf_fallback",
    };
  }

  const estimatedMinutes = Math.max(3, Math.round(result.text.length / 5.5 / 200));

  return {
    fields: { reader_mode: "flowable", flowable_content: result.text, estimated_minutes: estimatedMinutes },
    mode: "flowable",
  };
}

/**
 * Convenience wrapper running both phases back to back — fine for a
 * short catalog or local testing, but NOT what the deployed routes call
 * by default (see src/app/api/ingest/courses/route.ts and the cron
 * route), since chaining both phases in one request reintroduces the
 * same timeout risk this refactor exists to avoid. Kept for completeness
 * / a manual one-off run against a small result set.
 */
export async function runOpenContentIngest(): Promise<OpenContentIngestRunResult> {
  const metadata = await runMetadataIngestPhase();
  const extraction = await runExtractionBatchPhase();
  return { ok: metadata.ok && extraction.ok, metadata, extraction };
}
