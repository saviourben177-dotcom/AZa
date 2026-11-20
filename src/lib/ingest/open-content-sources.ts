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

export type IngestSource = "doab" | "open_textbook_library";

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

async function safeFetchJson(url: string, init?: RequestInit): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": "AzaCourseIngest/1.0 (+https://a-za.vercel.app)",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      console.error(`[open-content-ingest] fetch failed: ${url} -> HTTP ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[open-content-ingest] fetch threw: ${url} ->`, err instanceof Error ? err.message : err);
    return null;
  }
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
  // retrieveLink is a path (e.g. "/bitstream/handle/.../x.pdf") — DOAB's
  // own docs give examples without a host, so build the absolute URL off
  // the same directory.doabooks.org host used for search.
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

async function fetchDoab(): Promise<OpenContentIngestRow[]> {
  const results = await Promise.all(
    DOAB_QUERIES.map(async ({ query, category }) => {
      const url = `https://directory.doabooks.org/rest/search?query=${encodeURIComponent(query)}&expand=metadata,bitstreams&limit=30`;
      const data = await safeFetchJson(url);
      if (!Array.isArray(data)) {
        if (data !== null) {
          console.error(`[open-content-ingest] DOAB response for category "${category}" was not an array — skipping.`);
        }
        return [];
      }
      return (data as DoabItem[]).flatMap((item): OpenContentIngestRow[] => {
        const title = doabMeta(item, "dc.title") || item.name;
        if (!title) return [];
        const license = doabMeta(item, "dc.rights");
        // Per spec: only rows explicitly CC BY — DOAB's search query already
        // filters for "CC BY" in free text, but that matches anywhere in the
        // record, not just the license field, so re-check the actual
        // dc.rights value before accepting the row.
        if (!license || !/CC[\s-]?BY/i.test(license)) return [];
        const pdfUrl = doabPdfUrl(item);
        const ref = item.uuid || item.handle;
        if (!ref) return [];
        return [
          {
            source: "doab",
            source_ref: `doab-${ref}`,
            title: truncate(title, 300),
            author: doabMeta(item, "dc.contributor.author"),
            summary: doabMeta(item, "dc.description.abstract"),
            category,
            license,
            source_url: item.handle ? `https://directory.doabooks.org/handle/${item.handle}` : null,
            pdf_url: pdfUrl,
          },
        ];
      });
    })
  );
  return results.flat();
}

// ---------------------------------------------------------------------
// Open Textbook Library — one subject-filtered query per target category.
// Response shape per the public JSON API (confirmed field names: title,
// authors (array of {first_name,last_name} or strings depending on
// endpoint version), description, license, subjects, formats). Parsing
// here is deliberately defensive about field-name variance, since the
// exact nesting isn't independently re-verifiable from a sandboxed
// environment that can't reach open.umn.edu directly — unexpected shapes
// are skipped per-row rather than thrown.
// ---------------------------------------------------------------------

interface OtlFormat {
  format?: string;
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

const OTL_SUBJECT_QUERIES: { subject: string; category: string }[] = [
  { subject: "Computer Science", category: "coding" },
  { subject: "Information Systems", category: "coding" },
  { subject: "Business", category: "business" },
  { subject: "Finance", category: "business" },
  { subject: "Management", category: "business" },
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

async function fetchOpenTextbookLibrary(): Promise<OpenContentIngestRow[]> {
  const results = await Promise.all(
    OTL_SUBJECT_QUERIES.map(async ({ subject, category }) => {
      const url = `https://open.umn.edu/opentextbooks/subjects/${encodeURIComponent(subject)}.json`;
      const data = await safeFetchJson(url);
      // The API nests results under different keys depending on endpoint
      // (observed: a bare array, or { data: [...] }, or { textbooks: [...] })
      // — handle all three defensively rather than assuming one shape.
      const list: unknown = Array.isArray(data)
        ? data
        : (data as { data?: unknown; textbooks?: unknown } | null)?.data ??
          (data as { textbooks?: unknown } | null)?.textbooks ??
          null;
      if (!Array.isArray(list)) {
        if (data !== null) {
          console.error(`[open-content-ingest] OTL response for subject "${subject}" had an unrecognized shape — skipping.`);
        }
        return [];
      }
      return (list as OtlBook[]).flatMap((book): OpenContentIngestRow[] => {
        const license = otlLicenseName(book.license);
        // Per spec: only "Attribution CC BY" rows.
        if (!license || !/attribution.*cc.?by|cc.?by/i.test(license)) return [];
        if (!book.title || book.id == null) return [];
        const pdfFormat = book.formats?.find((f) => (f.format ?? "").toUpperCase() === "PDF" && f.url);
        return [
          {
            source: "open_textbook_library",
            source_ref: `otl-${book.id}`,
            title: truncate(book.title, 300),
            author: otlAuthorNames(book.authors),
            summary: book.description ?? null,
            category,
            license,
            source_url: book.url ?? `https://open.umn.edu/opentextbooks/textbooks/${book.id}`,
            pdf_url: pdfFormat?.url ?? null,
          },
        ];
      });
    })
  );
  return results.flat();
}

export interface OpenContentIngestSummary {
  doab: number;
  open_textbook_library: number;
  total: number;
}

export async function fetchAllOpenContent(): Promise<{
  rows: OpenContentIngestRow[];
  summary: OpenContentIngestSummary;
}> {
  const [doabRows, otlRows] = await Promise.all([fetchDoab(), fetchOpenTextbookLibrary()]);

  // Dedup across sources by source_ref, in case a category overlap (e.g.
  // the same OTL subject matched by two queries above) produced the same
  // row twice — keep the first occurrence.
  const seen = new Set<string>();
  const rows = [...doabRows, ...otlRows].filter((r) => {
    if (seen.has(r.source_ref)) return false;
    seen.add(r.source_ref);
    return true;
  });

  return {
    rows,
    summary: {
      doab: doabRows.length,
      open_textbook_library: otlRows.length,
      total: rows.length,
    },
  };
}
