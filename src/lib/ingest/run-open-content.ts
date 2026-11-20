import { createClient as createAdminClient } from "@supabase/supabase-js";
import { fetchAllOpenContent, type OpenContentIngestRow } from "@/lib/ingest/open-content-sources";
import { extractPdfForReader } from "@/lib/ingest/pdf-extract";

export interface OpenContentIngestRunResult {
  ok: boolean;
  fetched?: Awaited<ReturnType<typeof fetchAllOpenContent>>["summary"];
  upserted: number;
  extracted: { flowable: number; pdf_fallback: number; external_link: number; failed: number };
  error?: string;
}

/**
 * Runs one full Courses ingest pass: fetch DOAB + Open Textbook Library,
 * then for every row with a pdf_url, fetch and attempt text extraction to
 * decide reader_mode, then upsert everything into `courses` keyed on
 * (source, source_ref) — the unique partial index from the schema
 * migration. Same two-trigger-path pattern as the retired
 * run-courses.ts (manual POST + Vercel Cron GET), see
 * src/app/api/ingest/courses/route.ts and
 * src/app/api/cron/ingest-courses/route.ts.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — no logged-in user in
 * a cron context).
 *
 * PDF extraction is run with bounded concurrency (not Promise.all over
 * every row at once) since each extraction fetches a whole file and runs
 * pdf.js over it — doing 60+ of those simultaneously inside one
 * serverless invocation risks the function's own memory/time budget
 * (maxDuration = 60s) regardless of how fast any single one is.
 */
export async function runOpenContentIngest(): Promise<OpenContentIngestRunResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[open-content-ingest] SUPABASE_SERVICE_ROLE_KEY is not set — cannot run ingest.");
    return {
      ok: false,
      upserted: 0,
      extracted: { flowable: 0, pdf_fallback: 0, external_link: 0, failed: 0 },
      error: "Server misconfigured.",
    };
  }

  const supabase = createAdminClient(supabaseUrl, serviceRoleKey);
  const { rows, summary } = await fetchAllOpenContent();

  const extracted = { flowable: 0, pdf_fallback: 0, external_link: 0, failed: 0 };

  const CONCURRENCY = 4;
  const payload: Record<string, unknown>[] = [];

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((row) => extractOneRow(row)));
    for (const built of batchResults) {
      payload.push(built.row);
      extracted[built.mode] += 1;
    }
  }

  let upserted = 0;
  let upsertError: string | undefined;

  if (payload.length > 0) {
    const { error, count } = await supabase
      .from("courses")
      .upsert(payload, { onConflict: "source,source_ref", count: "exact" });

    if (error) {
      console.error("[open-content-ingest] upsert failed:", error.message);
      upsertError = error.message;
    } else {
      upserted = count ?? payload.length;
    }
  }

  return {
    ok: !upsertError,
    fetched: summary,
    upserted,
    extracted,
    ...(upsertError ? { error: upsertError } : {}),
  };
}

async function extractOneRow(
  row: OpenContentIngestRow
): Promise<{ row: Record<string, unknown>; mode: "flowable" | "pdf_fallback" | "external_link" | "failed" }> {
  const base = {
    source: row.source,
    source_ref: row.source_ref,
    title: row.title,
    author: row.author,
    summary: row.summary,
    category: row.category,
    license: row.license,
    source_url: row.source_url,
    pdf_url: row.pdf_url,
    is_coin_gated: false, // ingested rows start free; a curator can flip this on later — ingestion never gates content on its own
    unlock_cost: 25,
    is_published: true,
    ingested_at: new Date().toISOString(),
  };

  if (!row.pdf_url) {
    // No PDF at all for this record (DOAB/OTL entries sometimes have
    // metadata but no attached file) — route straight to an external
    // link to the source page rather than silently dropping the row.
    return {
      row: { ...base, reader_mode: "external_link", external_url: row.source_url, flowable_content: null },
      mode: "external_link",
    };
  }

  const result = await extractPdfForReader(row.pdf_url);

  if (!result.ok) {
    console.error(`[open-content-ingest] extraction failed for ${row.source_ref}: ${result.reason}`);
    return {
      row: { ...base, reader_mode: "pdf_fallback", flowable_content: null },
      mode: "failed",
    };
  }

  if (result.mode === "pdf_fallback") {
    console.error(`[open-content-ingest] falling back to pdf viewer for ${row.source_ref}: ${result.reason}`);
    return {
      row: {
        ...base,
        reader_mode: "pdf_fallback",
        flowable_content: null,
        estimated_minutes: result.pageCount ? Math.max(5, Math.round(result.pageCount * 1.5)) : null,
      },
      mode: "pdf_fallback",
    };
  }

  // Rough reading-time estimate: ~200 words/minute, ~5.5 chars/word
  // average for English prose — good enough for a card subtitle, not
  // presented as precise.
  const estimatedMinutes = Math.max(3, Math.round(result.text.length / 5.5 / 200));

  return {
    row: {
      ...base,
      reader_mode: "flowable",
      flowable_content: result.text,
      estimated_minutes: estimatedMinutes,
    },
    mode: "flowable",
  };
}
