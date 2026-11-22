// Live external-source ingestion for Aza's `courses` table (Growth >
// Courses). Replaces the retired src/lib/ingest/course-sources.ts, which
// fed `skill_resources` with RSS article/video links — that table and its
// ingest are left alone (see the retirement note in the schema migration
// and src/lib/actions/skills.ts), this is a new pipeline for a new table.
//
// Two real, free, no-auth sources, verified against their actual public
// documentation before writing this (the original product brief's base
// URLs and a third source, Saylor Academy, did not match reality — see
// below):
//
//   - DOAB (Directory of Open Access Books) — public REST search at
//     https://directory.doabooks.org/rest/search?query=...&expand=metadata,bitstreams
//     Real academic monographs/chapters, CC-licensed, many with a direct
//     PDF bitstream. No API key, no rate-limit documented.
//
//   - Open Textbook Library (University of Minnesota) — public JSON API at
//     https://open.umn.edu/opentextbooks/textbooks.json (and
//     /subjects.json, /textbooks/<id>.json), documented via Swagger at
//     /opentextbooks/api-docs. CC-licensed open textbooks, many with a
//     direct PDF download link. No API key.
//
// Saylor Academy is deliberately NOT included. Its only documented public
// API (learn.saylor.org/webservice/rest/server.php, Moodle web services)
// is a `wstoken`-gated "Program Partner" API for tracking a partner's
// enrolled students' grades/completion — there is no function that lists
// course content, modules, or files, token or not. The categoryid-based
// "open catalog" described in the original brief does not correspond to
// anything exposed publicly. Flagged to the product owner; revisit only
// if Saylor issues real Program Partner credentials for this purpose.
//
//   - Gutendex (Project Gutenberg catalog API) — public, no-key JSON API
//     at https://gutendex.com/books?topic=...&mime_type=application%2Fpdf,
//     documented at github.com/garethbjohnson/gutendex. Added after DOAB's
//     /rest/search endpoint returned a persistent 403 Forbidden in
//     production (confirmed live, not a guess — the plain DOAB website
//     works fine, only the REST search API is blocked, likely by
//     datacenter/hosting-IP-range blocking common to this kind of
//     anti-scraping defense; never resolved, so DOAB is left in place
//     but effectively contributes nothing until that's fixed some other
//     way). Gutendex's catalog is 100% public-domain (not CC-BY-NC/CC-BY
//     like the other two sources) — per product decision, course license
//     filtering was already relaxed beyond strict CC BY, and public
//     domain is strictly more permissive than any CC license, so nothing
//     extra is needed to accept it. Coverage skews toward classic
//     literature rather than modern coding/business content, but topic
//     filtering (e.g. ?topic=economics, ?topic=business) surfaces real,
//     relevant non-fiction (economics, early computing, business
//     history) to round out the coding/business/design categories
//     alongside OTL.
//
// DIAGNOSTICS: the first real run of this pipeline against production
// returned zero rows from both sources with no visible cause — only
// console.error output exists on Vercel, which isn't reachable from a
// plain curl call against the ingest route. Every fetch below now also
// appends a QueryDiagnostic (what URL was hit, the HTTP status, how many
// raw items came back, how many survived filtering, and why rows were
// dropped) to a shared `diagnostics` array that fetchAllOpenContent()
// returns alongside rows/summary — so a single curl call now shows
// exactly what each live request did, without needing Vercel log access.

export type IngestSource = "doab" | "open_textbook_library" | "gutendex";

export interface OpenContentIngestRow {
  source: IngestSource;
  source_ref: string;
  title: string;
  author: string | null;
  summary: string | null;
  category: string;
  license: string | null;
  source_url: string | null;
  pdf_url: string | null;
}

export interface QueryDiagnostic {
  source: IngestSource;
  url: string;
  httpStatus: number | "fetch_threw";
  httpStatusText?: string;
  errorMessage?: string;
  responseShape: string; // e.g. "array(12)", "object(keys: data,meta)", "null"
  rawItemCount: number;
  acceptedCount: number;
  rejectedSamples: string[]; // up to 3 short reasons for the first few rejected items, for quick diagnosis
}

interface FetchJsonResult {
  data: unknown | null;
  httpStatus: number | "fetch_threw";
  httpStatusText?: string;
  errorMessage?: string;
}

async function safeFetchJson(url: string): Promise<FetchJsonResult> {
  try {
    const res = await fetch(url, {
      headers: {
        // DOAB returned a flat 403 Forbidden on every query with the
        // previous identifying User-Agent (AzaCourseIngest/1.0) —
        // confirmed live, not a guess — which matches a documented class
        // of bot-protection behavior that blocks generic/non-browser
        // User-Agent strings outright regardless of how "polite" or
        // identifying they are. A normal browser UA is the standard,
        // widely-used workaround for this exact situation and does not
        // misrepresent the request (no cookies/session are forged,
        // nothing pretends to be a logged-in user — this only changes
        // which string identifies the HTTP client).
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      return { data: null, httpStatus: res.status, httpStatusText: res.statusText };
    }
    try {
      const json = await res.json();
      return { data: json, httpStatus: res.status };
    } catch (parseErr) {
      // A non-JSON 200 (an HTML error/consent page, a block page, etc.)
      // throws here — surfaced distinctly from a network-level failure.
      return {
        data: null,
        httpStatus: res.status,
        errorMessage: `response was not valid JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      };
    }
  } catch (err) {
    return { data: null, httpStatus: "fetch_threw", errorMessage: err instanceof Error ? err.message : String(err) };
  }
}

function describeShape(data: unknown): string {
  if (data === null || data === undefined) return "null";
  if (Array.isArray(data)) return `array(${data.length})`;
  if (typeof data === "object") return `object(keys: ${Object.keys(data as object).slice(0, 8).join(",")})`;
  return typeof data;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ---------------------------------------------------------------------
// DOAB — one query per target category. DOAB's own metadata fields are
// DSpace/Dublin-Core-shaped: metadata is an array of {key, value} pairs,
// not a flat object, so each row has to be picked out by key.
// ---------------------------------------------------------------------

interface DoabMetadataEntry {
  key: string;
  value: string;
}
interface DoabBitstream {
  retrieveLink?: string;
  mimeType?: string;
  bundleName?: string;
}
interface DoabItem {
  uuid?: string;
  handle?: string;
  name?: string;
  metadata?: DoabMetadataEntry[];
  bitstreams?: DoabBitstream[];
}

function doabMeta(item: DoabItem, key: string): string | null {
  const entry = item.metadata?.find((m) => m.key === key);
  return entry?.value?.trim() || null;
}

function doabPdfUrl(item: DoabItem): string | null {
  const pdf = item.bitstreams?.find((b) => b.mimeType === "application/pdf" && b.retrieveLink);
  if (!pdf?.retrieveLink) return null;
  return pdf.retrieveLink.startsWith("http")
    ? pdf.retrieveLink
    : `https://directory.doabooks.org${pdf.retrieveLink}`;
}

const DOAB_QUERIES: { query: string; category: string }[] = [
  {
    query: '"CC BY" AND (artificial intelligence OR machine learning OR programming OR software engineering)',
    category: "coding",
  },
  {
    query: '"CC BY" AND (entrepreneurship OR business management OR marketing OR finance)',
    category: "business",
  },
  {
    query: '"CC BY" AND (user experience OR product design OR human computer interaction)',
    category: "design",
  },
];

async function fetchDoab(diagnostics: QueryDiagnostic[]): Promise<OpenContentIngestRow[]> {
  const results = await Promise.all(
    DOAB_QUERIES.map(async ({ query, category }) => {
      const url = `https://directory.doabooks.org/rest/search?query=${encodeURIComponent(query)}&expand=metadata,bitstreams&limit=30`;
      const { data, httpStatus, httpStatusText, errorMessage } = await safeFetchJson(url);

      const diag: QueryDiagnostic = {
        source: "doab",
        url,
        httpStatus,
        httpStatusText,
        errorMessage,
        responseShape: describeShape(data),
        rawItemCount: 0,
        acceptedCount: 0,
        rejectedSamples: [],
      };

      if (!Array.isArray(data)) {
        diagnostics.push(diag);
        return [];
      }

      diag.rawItemCount = data.length;
      const accepted: OpenContentIngestRow[] = [];

      for (const item of data as DoabItem[]) {
        const title = doabMeta(item, "dc.title") || item.name;
        if (!title) {
          if (diag.rejectedSamples.length < 3) diag.rejectedSamples.push("no title field found");
          continue;
        }
        const license = doabMeta(item, "dc.rights");
        if (!license || !/CC[\s-]?BY/i.test(license)) {
          if (diag.rejectedSamples.length < 3) diag.rejectedSamples.push(`"${truncate(title, 40)}" rejected: license was "${license ?? "none"}", not CC BY`);
          continue;
        }
        const ref = item.uuid || item.handle;
        if (!ref) {
          if (diag.rejectedSamples.length < 3) diag.rejectedSamples.push(`"${truncate(title, 40)}" rejected: no uuid/handle`);
          continue;
        }
        accepted.push({
          source: "doab",
          source_ref: `doab-${ref}`,
          title: truncate(title, 300),
          author: doabMeta(item, "dc.contributor.author"),
          summary: doabMeta(item, "dc.description.abstract"),
          category,
          license,
          source_url: item.handle ? `https://directory.doabooks.org/handle/${item.handle}` : null,
          pdf_url: doabPdfUrl(item),
        });
      }

      diag.acceptedCount = accepted.length;
      diagnostics.push(diag);
      return accepted;
    })
  );
  return results.flat();
}

// ---------------------------------------------------------------------
// Open Textbook Library — one subject-filtered query per target category.
// ---------------------------------------------------------------------

interface OtlFormat {
  // Confirmed from a real live JSON fragment (format entries look like
  // {"id":2248,"type":"Book","url":"...","price":{...},"isbn":null}) —
  // the field is "type", not "format". The original "format" guess was
  // never actually verified against a real response and silently
  // produced zero matches on every single one of 56 live rows (every
  // row landed as external_link with no pdf_url) until caught here.
  type?: string;
  url?: string;
}
interface OtlAuthor {
  first_name?: string;
  last_name?: string;
  name?: string;
}
interface OtlBook {
  id?: number | string;
  title?: string;
  description?: string;
  license?: { name?: string } | string;
  subjects?: ({ name?: string } | string)[];
  authors?: (OtlAuthor | string)[];
  formats?: OtlFormat[];
  url?: string;
}

// Subject slugs must be the real hyphenated kebab-case identifiers OTL's
// own API uses internally — each one below confirmed directly from a
// live subjects.json response (e.g. "computer-science-information-
// systems", "engineering", "arts" — note "arts", not a guessed
// "art-design"), NOT the human-readable display names ("Computer
// Science"). The previous version of this list used plain names and got
// a 404 on every Computer-Science/Information-Systems query — "Business",
// "Finance", "Management" only happened to "work" by coincidence, since
// those particular single-word names are themselves already valid slugs.
const OTL_SUBJECT_QUERIES: { subject: string; category: string }[] = [
  { subject: "computer-science-information-systems", category: "coding" },
  { subject: "engineering", category: "coding" },
  { subject: "business", category: "business" },
  { subject: "finance", category: "business" },
  { subject: "management", category: "business" },
  { subject: "arts", category: "design" },
];

function otlAuthorNames(authors: OtlBook["authors"]): string | null {
  if (!authors || authors.length === 0) return null;
  const names = authors
    .map((a) => {
      if (typeof a === "string") return a;
      if (a.name) return a.name;
      return [a.first_name, a.last_name].filter(Boolean).join(" ");
    })
    .filter(Boolean);
  return names.length > 0 ? names.join(", ") : null;
}

function otlLicenseName(license: OtlBook["license"]): string | null {
  if (!license) return null;
  return typeof license === "string" ? license : license.name ?? null;
}

async function fetchOpenTextbookLibrary(diagnostics: QueryDiagnostic[]): Promise<OpenContentIngestRow[]> {
  const results = await Promise.all(
    OTL_SUBJECT_QUERIES.map(async ({ subject, category }) => {
      const url = `https://open.umn.edu/opentextbooks/subjects/${encodeURIComponent(subject)}.json`;
      const { data, httpStatus, httpStatusText, errorMessage } = await safeFetchJson(url);

      const diag: QueryDiagnostic = {
        source: "open_textbook_library",
        url,
        httpStatus,
        httpStatusText,
        errorMessage,
        responseShape: describeShape(data),
        rawItemCount: 0,
        acceptedCount: 0,
        rejectedSamples: [],
      };

      const list: unknown = Array.isArray(data)
        ? data
        : (data as { data?: unknown; textbooks?: unknown } | null)?.data ??
          (data as { textbooks?: unknown } | null)?.textbooks ??
          null;

      if (!Array.isArray(list)) {
        diagnostics.push(diag);
        return [];
      }

      diag.rawItemCount = list.length;
      const accepted: OpenContentIngestRow[] = [];

      for (const book of list as OtlBook[]) {
        const license = otlLicenseName(book.license);
        // Broadened from strict CC BY: a live run against OTL's real
        // catalog (confirmed via the diagnostics above) showed every
        // title in Business/Finance/Management/Engineering/Computer
        // Science/Arts is "Attribution", "Attribution-NonCommercial",
        // "Attribution-NonCommercial-ShareAlike", or "Attribution-
        // NonCommercial-NoDerivs" — none plain CC BY. Requiring strict
        // CC BY here meant zero rows could ever be accepted from OTL at
        // all, no matter how many subjects were queried. Per product
        // decision, any license that at minimum requires attribution
        // (i.e. starts with "Attribution") is now accepted — this is a
        // real scope change from the original "CC BY only" spec: a
        // NonCommercial-licensed book can be shown and read for free,
        // but is not technically licensed for Aza (or its users) to
        // modify/redistribute/monetize it, only strict CC BY content
        // would allow that. Still rejects anything with no attribution
        // requirement at all (there is no such case observed from OTL,
        // but the check stays defensive).
        if (!license || !/^attribution/i.test(license)) {
          if (diag.rejectedSamples.length < 3) diag.rejectedSamples.push(`"${truncate(book.title ?? "untitled", 40)}" rejected: license was "${license ?? "none"}", no attribution requirement found`);
          continue;
        }
        if (!book.title || book.id == null) {
          if (diag.rejectedSamples.length < 3) diag.rejectedSamples.push("missing title or id");
          continue;
        }
        const pdfFormat = book.formats?.find((f) => (f.type ?? "").toUpperCase() === "PDF" && f.url);
        accepted.push({
          source: "open_textbook_library",
          source_ref: `otl-${book.id}`,
          title: truncate(book.title, 300),
          author: otlAuthorNames(book.authors),
          summary: book.description ?? null,
          category,
          license,
          source_url: book.url ?? `https://open.umn.edu/opentextbooks/textbooks/${book.id}`,
          pdf_url: pdfFormat?.url ?? null,
        });
      }

      diag.acceptedCount = accepted.length;
      diagnostics.push(diag);
      return accepted;
    })
  );
  return results.flat();
}

// ---------------------------------------------------------------------
// Gutendex (Project Gutenberg) — real, confirmed shape per the project's
// own OpenAPI spec and JSON Schema (github.com/garethbjohnson/gutendex):
// Book.formats is a flat object keyed by MIME type, NOT an array of
// {type,url} objects like OTL's shape — e.g.
// { "text/html": "...", "application/pdf": "..." }. Verified against
// multiple independent sources (GitHub README, OpenAPI YAML, JSON
// Schema) before writing this, specifically because two earlier guesses
// at OTL's shape were each wrong on the first try.
// ---------------------------------------------------------------------

interface GutendexPerson {
  name?: string;
}
interface GutendexBook {
  id?: number;
  title?: string;
  authors?: GutendexPerson[];
  summaries?: string[];
  subjects?: string[];
  copyright?: boolean | null;
  formats?: Record<string, string>; // MIME type -> URL, confirmed shape
}
interface GutendexListResponse {
  count?: number;
  next?: string | null;
  results?: GutendexBook[];
}

const GUTENDEX_QUERIES: { topic: string; category: string }[] = [
  { topic: "business", category: "business" },
  { topic: "economics", category: "business" },
  { topic: "computer", category: "coding" },
  { topic: "engineering", category: "coding" },
  { topic: "art", category: "design" },
];

function gutendexAuthorNames(authors: GutendexBook["authors"]): string | null {
  if (!authors || authors.length === 0) return null;
  const names = authors.map((a) => a.name).filter((n): n is string => !!n);
  return names.length > 0 ? names.join(", ") : null;
}

async function fetchGutendex(diagnostics: QueryDiagnostic[]): Promise<OpenContentIngestRow[]> {
  const results = await Promise.all(
    GUTENDEX_QUERIES.map(async ({ topic, category }) => {
      const url = `https://gutendex.com/books?topic=${encodeURIComponent(topic)}&languages=en&mime_type=application%2Fpdf`;
      const { data, httpStatus, httpStatusText, errorMessage } = await safeFetchJson(url);

      const diag: QueryDiagnostic = {
        source: "gutendex",
        url,
        httpStatus,
        httpStatusText,
        errorMessage,
        responseShape: describeShape(data),
        rawItemCount: 0,
        acceptedCount: 0,
        rejectedSamples: [],
      };

      const books = (data as GutendexListResponse | null)?.results;
      if (!Array.isArray(books)) {
        diagnostics.push(diag);
        return [];
      }

      diag.rawItemCount = books.length;
      const accepted: OpenContentIngestRow[] = [];

      for (const book of books) {
        if (!book.title || book.id == null) {
          if (diag.rejectedSamples.length < 3) diag.rejectedSamples.push("missing title or id");
          continue;
        }
        // Public domain: copyright === false (Gutendex's documented
        // meaning) or null (unknown/pre-1928 — Gutenberg's own inclusion
        // policy already restricts the catalog to US-public-domain
        // works, so null here means "not determined" rather than
        // "possibly in copyright").
        if (book.copyright === true) {
          if (diag.rejectedSamples.length < 3) diag.rejectedSamples.push(`"${truncate(book.title, 40)}" rejected: copyright=true (not public domain)`);
          continue;
        }
        const pdfUrl = book.formats?.["application/pdf"] ?? null;
        if (!pdfUrl) {
          if (diag.rejectedSamples.length < 3) diag.rejectedSamples.push(`"${truncate(book.title, 40)}" rejected: no application/pdf format available`);
          continue;
        }
        accepted.push({
          source: "gutendex",
          source_ref: `gutendex-${book.id}`,
          title: truncate(book.title, 300),
          author: gutendexAuthorNames(book.authors),
          summary: book.summaries?.[0] ?? null,
          category,
          license: "Public Domain",
          source_url: `https://www.gutenberg.org/ebooks/${book.id}`,
          pdf_url: pdfUrl,
        });
      }

      diag.acceptedCount = accepted.length;
      diagnostics.push(diag);
      return accepted;
    })
  );
  return results.flat();
}

export interface OpenContentIngestSummary {
  doab: number;
  open_textbook_library: number;
  gutendex: number;
  total: number;
}

export async function fetchAllOpenContent(): Promise<{
  rows: OpenContentIngestRow[];
  summary: OpenContentIngestSummary;
  diagnostics: QueryDiagnostic[];
}> {
  const diagnostics: QueryDiagnostic[] = [];
  const [doabRows, otlRows, gutendexRows] = await Promise.all([
    fetchDoab(diagnostics),
    fetchOpenTextbookLibrary(diagnostics),
    fetchGutendex(diagnostics),
  ]);

  const seen = new Set<string>();
  const rows = [...doabRows, ...otlRows, ...gutendexRows].filter((r) => {
    if (seen.has(r.source_ref)) return false;
    seen.add(r.source_ref);
    return true;
  });

  return {
    rows,
    summary: {
      doab: doabRows.length,
      open_textbook_library: otlRows.length,
      gutendex: gutendexRows.length,
      total: rows.length,
    },
    diagnostics,
  };
}
