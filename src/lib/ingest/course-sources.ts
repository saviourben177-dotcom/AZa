// Live external-source ingestion for Aza's `skill_resources` table
// (Growth > Courses). Mirrors src/lib/ingest/sources.ts (the opportunities
// ingest) in structure and conventions — same safeFetch/RSS helpers, same
// source_ref dedup-key pattern, same shape of a per-source fetcher plus a
// fetchAll aggregator.
//
// Two real, free, no-auth sources, both verified live before writing this:
//   - freeCodeCamp "course" tag RSS (freecodecamp.org/news/tag/course/rss/)
//     — written course articles/tutorials, all free, all coding.
//   - YouTube channel RSS (youtube.com/feeds/videos.xml?channel_id=...) for
//     freeCodeCamp.org (UC8butISFwT-Wl7EV0hUK0BQ) and Khan Academy
//     (UC4a-Gbdw7vOaccHmFo40b9g) — full free video courses, no API key
//     needed, no quota.
//
// Unlike opportunities, skills.id is a required FK on skill_resources, so
// every row here must resolve to a skill_id. skills has no per-row
// provider/category-guessing logic — SKILL_BY_CATEGORY below maps each
// source to a fixed, pre-seeded skill id (see the
// 20261021190936_course_ingest_and_skills_seed.sql migration), rather than
// trying to infer a specific skill from free-text titles.
//
// Coverage note: this ingest currently reaches "coding" (both sources) and
// partially "ai"/"business" (Khan Academy touches finance/business, not
// true AI). "design", "trading", and "trades_diy" have no verified no-auth
// live source yet and are covered only by the hand-curated seed rows in
// the migration (source_ref IS NULL) — add a fetcher here once a real
// free/no-auth source for those categories is confirmed, rather than
// guessing a channel ID that may not exist or may not be free.

export type IngestResourceType = "course" | "article" | "video" | "tool";
export type IngestLevel = "beginner" | "intermediate" | "advanced";

export interface CourseIngestRow {
  source_ref: string;
  skill_name: string; // resolved to skill_id by the caller (run-courses.ts), which has DB access this module doesn't
  title: string;
  provider: string;
  url: string;
  resource_type: IngestResourceType;
  level: IngestLevel;
  duration_hours: number | null;
  is_free: boolean;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#8220;|&#8221;/g, '"')
    .trim();
}

function parseRssItems(xml: string, max: number): string[] {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))
    .slice(0, max)
    .map((m) => m[1]);
}

function parseAtomEntries(xml: string, max: number): string[] {
  return Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g))
    .slice(0, max)
    .map((m) => m[1]);
}

function rssField(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
  return m ? m[1] : "";
}

/** Atom <link href="..."/> (self-closing, attribute-based — different shape from RSS <link>text</link>). */
function atomLinkHref(block: string): string {
  const m = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) ?? block.match(/<link[^>]*href="([^"]+)"/);
  return m ? m[1] : "";
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": "AzaCourseFinder/1.0 (+https://a-za.vercel.app)",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      console.error(`[course-ingest] fetch failed: ${url} -> HTTP ${res.status} ${res.statusText}`);
      return null;
    }
    return res;
  } catch (err) {
    console.error(`[course-ingest] fetch threw: ${url} ->`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ---- 1. freeCodeCamp — "course" tag RSS (written course articles) ----
async function fetchFreeCodeCamp(): Promise<CourseIngestRow[]> {
  const res = await safeFetch("https://www.freecodecamp.org/news/tag/course/rss/");
  if (!res) return [];
  const xml = await res.text();
  const items = parseRssItems(xml, 15);
  return items.map((block) => {
    const title = stripHtml(rssField(block, "title")) || "Free coding course";
    const link = rssField(block, "link").trim() || "https://www.freecodecamp.org/news/";
    return {
      source_ref: `fcc-rss-${Buffer.from(link).toString("base64url").slice(0, 32)}`,
      skill_name: "Web Development",
      title: title.slice(0, 200),
      provider: "freeCodeCamp",
      url: link,
      resource_type: "course" as const,
      level: "beginner" as const,
      duration_hours: null,
      is_free: true,
    };
  });
}

// ---- 2. freeCodeCamp YouTube channel — full video courses ----
async function fetchFreeCodeCampVideos(): Promise<CourseIngestRow[]> {
  const res = await safeFetch("https://www.youtube.com/feeds/videos.xml?channel_id=UC8butISFwT-Wl7EV0hUK0BQ");
  if (!res) return [];
  const xml = await res.text();
  const entries = parseAtomEntries(xml, 15);
  return entries.map((block) => {
    const title = stripHtml(rssField(block, "title")) || "Free coding video course";
    const videoId = rssField(block, "yt:videoId").trim();
    const link = videoId ? `https://www.youtube.com/watch?v=${videoId}` : atomLinkHref(block);
    return {
      source_ref: `fcc-yt-${videoId || Buffer.from(link).toString("base64url").slice(0, 24)}`,
      skill_name: "Web Development",
      title: title.slice(0, 200),
      provider: "freeCodeCamp (YouTube)",
      url: link || "https://www.youtube.com/@freecodecamp",
      resource_type: "video" as const,
      level: "beginner" as const,
      duration_hours: null,
      is_free: true,
    };
  });
}

// ---- 3. Khan Academy YouTube channel ----
async function fetchKhanAcademyVideos(): Promise<CourseIngestRow[]> {
  const res = await safeFetch("https://www.youtube.com/feeds/videos.xml?channel_id=UC4a-Gbdw7vOaccHmFo40b9g");
  if (!res) return [];
  const xml = await res.text();
  const entries = parseAtomEntries(xml, 15);
  return entries.map((block) => {
    const title = stripHtml(rssField(block, "title")) || "Free Khan Academy lesson";
    const videoId = rssField(block, "yt:videoId").trim();
    const link = videoId ? `https://www.youtube.com/watch?v=${videoId}` : atomLinkHref(block);
    // Khan Academy's channel is broad (math/science/finance); route to
    // Financial Literacy since that's the one seeded skill it reliably
    // overlaps with content-wise — most of its catalog outside that is
    // K-12 academic subjects Aza doesn't have skills for.
    return {
      source_ref: `khan-yt-${videoId || Buffer.from(link).toString("base64url").slice(0, 24)}`,
      skill_name: "Financial Literacy",
      title: title.slice(0, 200),
      provider: "Khan Academy",
      url: link || "https://www.youtube.com/@khanacademy",
      resource_type: "video" as const,
      level: "beginner" as const,
      duration_hours: null,
      is_free: true,
    };
  });
}

export interface CourseIngestSummary {
  freecodecamp_articles: number;
  freecodecamp_videos: number;
  khanacademy_videos: number;
  total: number;
}

export async function fetchAllLiveCourses(): Promise<{
  rows: CourseIngestRow[];
  summary: CourseIngestSummary;
}> {
  const [fccArticles, fccVideos, khanVideos] = await Promise.all([
    fetchFreeCodeCamp(),
    fetchFreeCodeCampVideos(),
    fetchKhanAcademyVideos(),
  ]);

  const rows = [...fccArticles, ...fccVideos, ...khanVideos];
  return {
    rows,
    summary: {
      freecodecamp_articles: fccArticles.length,
      freecodecamp_videos: fccVideos.length,
      khanacademy_videos: khanVideos.length,
      total: rows.length,
    },
  };
}
