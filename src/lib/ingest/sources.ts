// Live external-source ingestion for Aza's `opportunities` table.
//
// Seven real, free, no-auth sources — four for jobs, one each for
// hackathons, scholarships, and grants/fellowships. Ported from the
// equivalent module in the aza-opportunity-finder (HackSocial) codebase and
// re-mapped onto THIS app's actual `opportunities` row shape (see
// src/lib/types.ts Opportunity and src/lib/actions/opportunities.ts
// createOpportunity) — the two repos have different schemas (this one uses
// `org`/`apply_url`/a narrower category enum, no `eligibleCountries`/
// `skills`/etc columns), so the row builders below are new, not
// copy-pasted.
//
// Deliberately NOT Nigeria/Africa-only: every job source here is a global
// remote-jobs feed, same as the two already live. There is no free, no-auth
// API with real-time Nigerian or African-specific listings (Jobberman and
// BrighterMonday have no public API; Adzuna's documented country coverage
// doesn't include Nigeria) — see flagsRestrictiveEligibility() below for
// how the resulting eligibility uncertainty is surfaced honestly instead
// of pretending to filter by country. Genuine Nigeria/Africa-specific
// volume is a curator-added (hand-curated, source_ref IS NULL) job, same
// pattern as the existing 57 hand-curated rows — not a separate ingest
// pipeline, so the feed reads as one global opportunity list, not a
// one-country app bolted onto a global one.
//
// Attribution / usage requirements (checked at integration time, Aug 2026,
// updated Oct 2026):
//   - Himalayas: requires a visible link back + "via Himalayas" mention.
//     Do not push their listings into other third-party job aggregators.
//   - Jobicy: requires attribution; poll at most hourly; do not
//     redistribute to other job boards/aggregators.
//   - Devpost: no official API. Uses a community-maintained daily-scraped
//     JSON mirror (open-hackathons-api). Fragile by nature — if this
//     mirror goes down, this source silently returns zero rows rather
//     than failing the whole ingest run.
//   - Scholars4Dev / The Grant Desk: standard RSS, no redistribution
//     restrictions found, but only title/link/short description are
//     reliably structured — full eligibility/deadline detail lives on
//     the source site, which is why apply_url always points back there.
//   - Remotive: official API (github.com/remotive-com/remote-jobs-api).
//     Docs ask for at most ~4 requests/day — fine for this app's
//     once-daily cron; do not add a second, more frequent trigger that
//     also calls this source without revisiting that limit.
//   - Arbeitnow: public job-board API, no documented redistribution
//     restriction found. Skews EU/Germany-heavy — filtered to remote=true
//     rows only, to keep what's ingested relevant to a remote-first app.
//
// Hero images: this app already renders a category-keyed stock image for
// every opportunity card (src/lib/category-visuals.ts CATEGORY_IMAGE) —
// there is no per-row image column to fill in and nothing to source here.
// logo_url (org logo tile) is left null for every ingested row, same as
// any other opportunity without a known org logo; the UI already falls
// back to a category glyph tile when it's null.
//
// Every row gets a stable `source_ref` (e.g. "jobicy-12345") so re-running
// this ingest upserts instead of duplicating, and is attributed to the
// editorial identity via created_by.

export type IngestCategory =
  | "scholarship"
  | "grant"
  | "hackathon"
  | "fellowship"
  | "internship"
  | "competition"
  | "job_gig";

export interface IngestRow {
  source_ref: string;
  title: string;
  org: string;
  category: IngestCategory;
  description: string;
  eligibility: string | null;
  deadline: string | null; // ISO date
  apply_url: string;
  location: string | null;
  remote: boolean;
  tags: string[];
  job_type: string | null;
  paid: boolean | null;
  salary_range: string | null;
}

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const in92Days = () => new Date(Date.now() + 92 * 86_400_000);

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function parseRssItems(xml: string, max: number): string[] {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))
    .slice(0, max)
    .map((m) => m[1]);
}

function rssField(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
  return m ? m[1] : "";
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        // Some sources (WordPress sites especially) reject requests with
        // no or generic User-Agent headers. Identify honestly rather than
        // spoofing a browser.
        "User-Agent": "AzaOpportunityFinder/1.0 (+https://a-za.vercel.app)",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      console.error(`[ingest] fetch failed: ${url} -> HTTP ${res.status} ${res.statusText}`);
      return null;
    }
    return res;
  } catch (err) {
    console.error(`[ingest] fetch threw: ${url} ->`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ---- 1. Himalayas — remote jobs ----
interface HimalayasJob {
  guid: string;
  title?: string;
  companyName?: string;
  categories?: string[];
  excerpt?: string;
  expiryDate?: string;
  applicationLink?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  salaryPeriod?: string;
}

async function fetchHimalayas(): Promise<IngestRow[]> {
  const res = await safeFetch("https://himalayas.app/jobs/api?limit=20");
  if (!res) return [];
  const data = (await res.json()) as { jobs?: HimalayasJob[] };
  const jobs = data?.jobs ?? [];
  return jobs.map((j) => {
    const tags: string[] = (j.categories ?? []).slice(0, 5);
    const funding = j.minSalary
      ? `${j.currency ?? "USD"} ${j.minSalary}-${j.maxSalary ?? j.minSalary} (${j.salaryPeriod ?? "annual"})`
      : null;
    return {
      source_ref: `himalayas-${j.guid}`,
      title: String(j.title ?? "Remote role").slice(0, 200),
      org: String(j.companyName ?? "Unknown company").slice(0, 200),
      category: "job_gig" as const,
      description: `${stripHtml(j.excerpt ?? "").slice(0, 450)} (Sourced via Himalayas — himalayas.app)`.slice(
        0,
        5000
      ),
      eligibility: null,
      deadline: toISO(j.expiryDate ? new Date(j.expiryDate) : in92Days()),
      apply_url: j.applicationLink || "https://himalayas.app",
      location: null,
      remote: true,
      tags,
      job_type: "full_time",
      paid: funding ? true : null,
      salary_range: funding,
    };
  });
}

// ---- 2. Jobicy — remote jobs ----
interface JobicyJob {
  id: string | number;
  jobTitle?: string;
  companyName?: string;
  jobExcerpt?: string;
  jobIndustry?: string | string[];
  jobGeo?: string;
  url?: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  salaryCurrency?: string;
}

async function fetchJobicy(): Promise<IngestRow[]> {
  const res = await safeFetch("https://jobicy.com/api/v2/remote-jobs?count=20");
  if (!res) return [];
  const data = (await res.json()) as { jobs?: JobicyJob[] };
  const jobs = data?.jobs ?? [];
  return jobs.map((j) => {
    // jobIndustry has been observed as both a string and an array from this
    // API — always normalize to an array before use (this exact shape bug
    // corrupted rows in the HackSocial app's ingestion; guard against it here).
    const industries: string[] = (Array.isArray(j.jobIndustry) ? j.jobIndustry : [j.jobIndustry]).filter(
      (v): v is string => typeof v === "string" && v.length > 0
    );
    const funding = j.annualSalaryMin
      ? `${j.salaryCurrency ?? "USD"} ${j.annualSalaryMin}-${j.annualSalaryMax ?? j.annualSalaryMin}/yr`
      : null;
    return {
      source_ref: `jobicy-${j.id}`,
      title: String(j.jobTitle ?? "Remote role").slice(0, 200),
      org: String(j.companyName ?? "Unknown company").slice(0, 200),
      category: "job_gig" as const,
      description: `${stripHtml(j.jobExcerpt ?? "").slice(0, 450)} (Sourced via Jobicy — jobicy.com)`.slice(
        0,
        5000
      ),
      eligibility: null,
      deadline: toISO(in92Days()),
      apply_url: j.url || "https://jobicy.com",
      location: j.jobGeo && j.jobGeo !== "Worldwide" ? String(j.jobGeo) : null,
      remote: true,
      tags: industries,
      job_type: "full_time",
      paid: funding ? true : null,
      salary_range: funding,
    };
  });
}

// ---- 3. Devpost — hackathons (via community-maintained JSON mirror; no official API exists) ----
interface DevpostHackathon {
  id: string | number;
  title?: string;
  organization_name?: string;
  submission_period_dates?: string;
  url?: string;
  displayed_location?: string;
  isOpen?: string;
  prizeText?: string;
  themes?: { name: string }[];
}

async function fetchDevpost(): Promise<IngestRow[]> {
  const res = await safeFetch("https://webdevharsha.github.io/open-hackathons-api/data.json");
  if (!res) return [];
  const data = (await res.json()) as { hackathons?: DevpostHackathon[] };
  const hackathons = data?.hackathons ?? [];
  return hackathons
    .filter((h) => h.isOpen === "open")
    .slice(0, 20)
    .map((h) => {
      const themes: string[] = (h.themes ?? []).map((t) => t.name).slice(0, 5);
      return {
        source_ref: `devpost-${h.id}`,
        title: String(h.title ?? "Hackathon").trim().slice(0, 200),
        org: String(h.organization_name ?? "Unknown organizer").slice(0, 200),
        category: "hackathon" as const,
        description: `${h.submission_period_dates ?? ""}. Themes: ${themes.join(", ")}. (Listed via Devpost)`.slice(
          0,
          5000
        ),
        eligibility: null,
        deadline: toISO(in92Days()),
        apply_url: h.url || "https://devpost.com/hackathons",
        location: h.displayed_location === "Online" ? null : String(h.displayed_location ?? "") || null,
        remote: h.displayed_location === "Online",
        tags: themes,
        job_type: null,
        paid: null,
        salary_range: h.prizeText ? stripHtml(h.prizeText).slice(0, 200) : null,
      };
    });
}

// ---- 4. Scholars4Dev — scholarships (RSS) ----
async function fetchScholars4Dev(): Promise<IngestRow[]> {
  const res = await safeFetch("https://www.scholars4dev.com/feed/");
  if (!res) return [];
  const xml = await res.text();
  const items = parseRssItems(xml, 15);
  return items.map((block, i) => {
    const title = stripHtml(rssField(block, "title")) || "Scholarship opportunity";
    const link = rssField(block, "link").trim() || "https://www.scholars4dev.com";
    return {
      source_ref: `scholars4dev-${Buffer.from(link).toString("base64url").slice(0, 24)}-${i}`,
      title: title.slice(0, 200),
      org: "Various — see listing",
      category: "scholarship" as const,
      description:
        "Scholarship listing curated by Scholars4Dev. See the original listing for full eligibility and deadline details.",
      eligibility: "See original listing for eligibility details.",
      deadline: toISO(in92Days()),
      apply_url: link,
      location: null,
      remote: true,
      tags: ["scholarship", "international"],
      job_type: null,
      paid: null,
      salary_range: null,
    };
  });
}

// ---- 5. The Grant Desk — grants + fellowships (RSS) ----
async function fetchGrantDesk(): Promise<IngestRow[]> {
  const res = await safeFetch("https://www.artificialnouveau.com/smalltools/grants/feed-worldwide.xml");
  if (!res) return [];
  const xml = await res.text();
  const items = parseRssItems(xml, 15);
  return items.map((block, i) => {
    const title = stripHtml(rssField(block, "title")) || "Grant/fellowship opportunity";
    const link = rssField(block, "link").trim() || "https://www.artificialnouveau.com/smalltools/grants/";
    const desc = stripHtml(rssField(block, "description"));
    const deadlineMatch = desc.match(/Deadline:\s*(\d{1,2}\s\w{3}\s\d{4})/);
    let deadline = toISO(in92Days());
    if (deadlineMatch) {
      const parsed = new Date(deadlineMatch[1]);
      if (!isNaN(parsed.getTime())) deadline = toISO(parsed);
    }
    const isFellowship = /fellowship|residenc/i.test(title);
    return {
      source_ref: `grantdesk-${Buffer.from(link).toString("base64url").slice(0, 24)}-${i}`,
      title: title.slice(0, 200),
      org: "Various — see listing",
      category: (isFellowship ? "fellowship" : "grant") as IngestCategory,
      description: (desc || "See original listing for full details.").slice(0, 5000),
      eligibility: "See original listing for eligibility details.",
      deadline,
      apply_url: link,
      location: null,
      remote: true,
      tags: ["funding", "international"],
      job_type: null,
      paid: null,
      salary_range: null,
    };
  });
}

// ---- 6. Remotive — remote jobs (worldwide, not region-specific) ----
// Official API (github.com/remotive-com/remote-jobs-api): docs ask for at
// most ~4 requests/day — fine for this app's once-daily cron, would NOT be
// fine for a more frequent poll. candidate_required_location is the most
// reliable free-text eligibility signal of any source wired up so far
// (often an explicit "Worldwide", "USA Only", "Europe", etc.) — surfaced
// via flagsRestrictiveEligibility() below rather than used to filter rows
// outright, since it's inconsistent across listings.
interface RemotiveJob {
  id: number;
  title?: string;
  company_name?: string;
  category?: string;
  job_type?: string;
  candidate_required_location?: string;
  salary?: string;
  url?: string;
  description?: string;
}

async function fetchRemotive(): Promise<IngestRow[]> {
  const res = await safeFetch("https://remotive.com/api/remote-jobs?limit=25");
  if (!res) return [];
  const data = (await res.json()) as { jobs?: RemotiveJob[] };
  const jobs = data?.jobs ?? [];
  return jobs.map((j) => {
    const loc = j.candidate_required_location?.trim() || null;
    return {
      source_ref: `remotive-${j.id}`,
      title: String(j.title ?? "Remote role").slice(0, 200),
      org: String(j.company_name ?? "Unknown company").slice(0, 200),
      category: "job_gig" as const,
      description: `${stripHtml(j.description ?? "").slice(0, 450)} (Sourced via Remotive — remotive.com)`.slice(
        0,
        5000
      ),
      eligibility: loc && loc.toLowerCase() !== "worldwide" ? `Candidate location: ${loc}` : null,
      deadline: toISO(in92Days()),
      apply_url: j.url || "https://remotive.com",
      location: loc && loc.toLowerCase() !== "worldwide" ? loc : null,
      remote: true,
      tags: j.category ? [j.category] : [],
      job_type: j.job_type || "full_time",
      paid: j.salary ? true : null,
      salary_range: j.salary || null,
    };
  });
}

// ---- 7. Arbeitnow — jobs (mostly Europe-based, but a real free no-auth
// source with no account/key required; many postings are explicitly remote) ----
interface ArbeitnowJob {
  slug: string;
  title?: string;
  company_name?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
}

async function fetchArbeitnow(): Promise<IngestRow[]> {
  const res = await safeFetch("https://www.arbeitnow.com/api/job-board-api");
  if (!res) return [];
  const data = (await res.json()) as { data?: ArbeitnowJob[] };
  const jobs = (data?.data ?? []).filter((j) => j.remote).slice(0, 25);
  return jobs.map((j) => ({
    source_ref: `arbeitnow-${j.slug}`,
    title: String(j.title ?? "Remote role").slice(0, 200),
    org: String(j.company_name ?? "Unknown company").slice(0, 200),
    category: "job_gig" as const,
    description: `${stripHtml(j.description ?? "").slice(0, 450)} (Sourced via Arbeitnow — arbeitnow.com)`.slice(
      0,
      5000
    ),
    eligibility: null,
    deadline: toISO(in92Days()),
    apply_url: j.url || "https://www.arbeitnow.com",
    location: j.location || null,
    remote: true,
    tags: (j.tags ?? []).slice(0, 5),
    job_type: (j.job_types ?? [])[0] ?? "full_time",
    paid: null,
    salary_range: null,
  }));
}

// Loose signal only — a hint for the UI, never a filter. None of the wired
// sources reliably state country eligibility, so this flags common
// exclusionary phrasing found in free-text descriptions/locations rather
// than claiming to verify anything. False positives/negatives are expected.
const RESTRICTIVE_PATTERNS =
  /\b(us\s*only|usa\s*only|u\.s\.\s*only|united states only|must be (?:based|located) in the (?:us|u\.s\.|united states)|eu\s*only|europe\s*only|european union only|must be (?:eu|europe)[- ]based|uk\s*only|united kingdom only|work authorization required|must be authorized to work in)\b/i;

export function flagsRestrictiveEligibility(text: string | null): boolean {
  if (!text) return false;
  return RESTRICTIVE_PATTERNS.test(text);
}

export interface IngestSummary {
  himalayas: number;
  jobicy: number;
  devpost: number;
  scholars4dev: number;
  grantdesk: number;
  remotive: number;
  arbeitnow: number;
  total: number;
}

export async function fetchAllLiveOpportunities(): Promise<{
  rows: IngestRow[];
  summary: IngestSummary;
}> {
  const [himalayas, jobicy, devpost, scholars4dev, grantdesk, remotive, arbeitnow] = await Promise.all([
    fetchHimalayas(),
    fetchJobicy(),
    fetchDevpost(),
    fetchScholars4Dev(),
    fetchGrantDesk(),
    fetchRemotive(),
    fetchArbeitnow(),
  ]);

  const rows = [...himalayas, ...jobicy, ...devpost, ...scholars4dev, ...grantdesk, ...remotive, ...arbeitnow];
  return {
    rows,
    summary: {
      himalayas: himalayas.length,
      jobicy: jobicy.length,
      devpost: devpost.length,
      scholars4dev: scholars4dev.length,
      grantdesk: grantdesk.length,
      remotive: remotive.length,
      arbeitnow: arbeitnow.length,
      total: rows.length,
    },
  };
}

// The 92-day expiry rule (ingested rows whose deadline has passed get
// swept; hand-curated rows with source_ref IS NULL are never touched) is
// implemented directly against the Supabase client in the ingest route
// (src/app/api/ingest/opportunities/route.ts), not here — kept as one
// source of truth instead of a parallel raw-SQL statement that could drift
// out of sync with it.
