// PDF text extraction for the Courses ingest pipeline. Decides, per
// courses.reader_mode, whether a fetched PDF's extracted text is clean
// enough for the in-app flowable reader, or whether to fall back to a
// plain embedded PDF viewer against pdf_url instead.
//
// Uses unpdf (https://github.com/unjs/unpdf) — a dependency-light,
// serverless-friendly pdf.js wrapper with no native bindings, which matters
// here since this runs inside a Vercel serverless function (see
// maxDuration = 60 on the ingest routes), not a long-lived server.

import { getDocumentProxy, extractText } from "unpdf";

export type PdfExtractionResult =
  | { ok: true; mode: "flowable"; text: string; pageCount: number }
  | { ok: true; mode: "pdf_fallback"; reason: string; pageCount: number | null }
  | { ok: false; reason: string };

const MAX_PDF_BYTES = 40 * 1024 * 1024; // 40 MB — generous for an academic monograph/textbook, cheap to bail out past this rather than let a huge file blow the function's time/memory budget.
const MIN_CHARS_PER_PAGE_FOR_FLOWABLE = 200; // Below this, a page is almost certainly a scan with no extractable text layer, or a cover/blank page — too thin to read comfortably in a reflowed view.
const MAX_REPLACEMENT_CHAR_RATIO = 0.02; // More than ~2% U+FFFD (replacement character) in the extracted text signals a broken/garbled font-encoding extraction — a known failure mode for some scanned-then-OCRed or custom-encoded academic PDFs. Not scanned-and-never-OCRed (that just yields near-zero characters, caught by the per-page floor above).

/** Collapses the small-caps/ligature noise and excess whitespace unpdf's
 * raw text extraction tends to leave in, without altering real content —
 * this is strictly whitespace/control-character normalization, never a
 * rewrite of the source text itself (see the courses.flowable_content
 * column comment: content is presented honestly, as extracted). */
function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function replacementCharRatio(text: string): number {
  if (text.length === 0) return 0;
  const replacementCount = (text.match(/\uFFFD/g) ?? []).length;
  return replacementCount / text.length;
}

/**
 * Fetches a PDF from pdfUrl and decides flowable vs pdf_fallback. Never
 * throws — every failure path returns a typed result so the caller
 * (run-open-content.ts) can upsert a row either way rather than aborting the
 * whole ingest batch over one bad source document.
 */
export async function extractPdfForReader(pdfUrl: string): Promise<PdfExtractionResult> {
  let res: Response;
  try {
    res = await fetch(pdfUrl, {
      headers: { "User-Agent": "AzaCourseIngest/1.0 (+https://a-za.vercel.app)" },
    });
  } catch (err) {
    return { ok: false, reason: `fetch threw: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!res.ok) {
    return { ok: false, reason: `fetch failed: HTTP ${res.status} ${res.statusText}` };
  }

  const contentLength = Number(res.headers.get("content-length") ?? "0");
  if (contentLength > MAX_PDF_BYTES) {
    // Known upfront from the header — skip the download entirely rather
    // than stream tens of megabytes just to decide it's too big.
    return { ok: true, mode: "pdf_fallback", reason: `pdf too large (${contentLength} bytes) to extract in the ingest function`, pageCount: null };
  }

  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_PDF_BYTES) {
    return { ok: true, mode: "pdf_fallback", reason: `pdf too large (${arrayBuffer.byteLength} bytes) to extract`, pageCount: null };
  }

  const bytes = new Uint8Array(arrayBuffer);

  let totalPages: number;
  let mergedText: string;
  try {
    const doc = await getDocumentProxy(bytes);
    const extracted = await extractText(doc, { mergePages: true });
    totalPages = extracted.totalPages;
    mergedText = extracted.text;
  } catch (err) {
    // Encrypted PDFs, corrupt files, and a handful of pdf.js-unsupported
    // encodings throw here — all of these are legitimately "can't extract
    // cleanly", not an ingest bug, so route to the PDF fallback viewer
    // rather than failing the row.
    return {
      ok: true,
      mode: "pdf_fallback",
      reason: `pdf.js extraction threw: ${err instanceof Error ? err.message : String(err)}`,
      pageCount: null,
    };
  }

  if (totalPages <= 0) {
    return { ok: true, mode: "pdf_fallback", reason: "pdf reported zero pages", pageCount: 0 };
  }

  const cleaned = normalizeExtractedText(mergedText);
  const charsPerPage = cleaned.length / totalPages;

  if (charsPerPage < MIN_CHARS_PER_PAGE_FOR_FLOWABLE) {
    return {
      ok: true,
      mode: "pdf_fallback",
      reason: `too little extractable text (${Math.round(charsPerPage)} chars/page avg over ${totalPages} pages) — likely a scanned document with no text layer`,
      pageCount: totalPages,
    };
  }

  const garbledRatio = replacementCharRatio(cleaned);
  if (garbledRatio > MAX_REPLACEMENT_CHAR_RATIO) {
    return {
      ok: true,
      mode: "pdf_fallback",
      reason: `extracted text is ${(garbledRatio * 100).toFixed(1)}% replacement characters — likely a font-encoding issue`,
      pageCount: totalPages,
    };
  }

  return { ok: true, mode: "flowable", text: cleaned, pageCount: totalPages };
}
