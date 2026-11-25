/**
 * Maps a user's onboarding profile data (field_of_interest, industry,
 * skilled_or_unskilled, business_description, freelance_skill) to a
 * suggested default Courses category and Prep field — used only to pick
 * a sensible starting point on first visit, never to filter out other
 * options. The person can always browse every category/field; this only
 * decides what's shown/selected by default.
 *
 * field_of_interest and industry are free text in the database (the
 * onboarding UI's FieldPicker explicitly allows "search or add your
 * own" beyond its built-in FIELDS/INDUSTRIES lists — see
 * src/app/onboarding/onboarding-flow.tsx), so this matches by keyword
 * rather than exact value, and simply returns null (no suggestion,
 * not a guess) for anything unrecognized.
 */

export type CourseCategory =
  | "coding"
  | "business"
  | "design"
  | "general"
  // 5 fine-grained categories added in response to real user feedback
  // (Data Analysis, Trading/Forex, AI Automation & Bot Building, Client
  // Acquisition & Retention, Ghostwriting/Copywriting — see
  // open-content-sources.ts and the curated rows added 2026-11-25).
  // Wired into RULES below with their own specific keyword sets, placed
  // ahead of the generic "business" rule so e.g. "forex trader" or
  // "copywriter" resolve to the new, more specific category instead of
  // being swallowed by the broad business bucket.
  | "data_analysis"
  | "trading_forex"
  | "automation"
  | "client_acquisition"
  | "copywriting";
export const PREP_FIELD_SLUGS = [
  "web-dev",
  "data-ai",
  "product-design",
  "business-entrepreneurship",
  "general-workplace",
] as const;
export type PrepFieldSlug = (typeof PREP_FIELD_SLUGS)[number];

export interface TailoringProfile {
  field_of_interest: string | null;
  industry: string | null;
  business_description: string | null;
  freelance_skill: string | null;
  skilled_or_unskilled: string | null;
}

interface KeywordRule {
  keywords: string[];
  category: CourseCategory;
  prepFieldSlug: PrepFieldSlug;
}

// Ordered — the first matching rule wins, so a value matching several
// rules (e.g. "Computer Science" containing both "computer" and
// "science") resolves to the more specific/likely-intended one.
const RULES: KeywordRule[] = [
  { keywords: ["computer science", "software", "web dev", "programming", "coding", "information technology"], category: "coding", prepFieldSlug: "web-dev" },
  // Specific, trending digital-skill categories placed ahead of the
  // generic "coding"/"business" rules below so e.g. "forex trader" or
  // "copywriter" resolve here instead of being swallowed by broader
  // keywords ("trade", "business") further down.
  { keywords: ["data analysis", "data analyst", "data science", "statistics", "business analytics"], category: "data_analysis", prepFieldSlug: "data-ai" },
  { keywords: ["forex", "fx trading", "currency trading", "stock trading", "crypto trading", "day trading"], category: "trading_forex", prepFieldSlug: "business-entrepreneurship" },
  { keywords: ["automation", "chatbot", "telegram bot", "whatsapp bot", "bot building", "ai agent"], category: "automation", prepFieldSlug: "web-dev" },
  { keywords: ["client acquisition", "lead generation", "customer retention", "sales rep", "business development"], category: "client_acquisition", prepFieldSlug: "business-entrepreneurship" },
  { keywords: ["copywriting", "copywriter", "ghostwriting", "ghostwriter", "content writing", "content writer"], category: "copywriting", prepFieldSlug: "general-workplace" },
  { keywords: ["data", "machine learning", "artificial intelligence", "analytics"], category: "coding", prepFieldSlug: "data-ai" },
  { keywords: ["engineering", "mechanical", "marine", "electrical", "civil"], category: "coding", prepFieldSlug: "web-dev" },
  { keywords: ["art", "textile", "design", "graphic", "fashion"], category: "design", prepFieldSlug: "product-design" },
  { keywords: ["business", "economics", "finance", "banking", "retail", "entrepreneur", "marketing"], category: "business", prepFieldSlug: "business-entrepreneurship" },
];

/**
 * Matches a keyword only at a word boundary (not as a bare substring) —
 * a naive `.includes()` check against very short keywords like a bare
 * "ai" or "ui" false-positives inside ordinary words ("retAIl",
 * "entertAInment", "bUIlding"), which would silently mis-tailor a
 * profile that has nothing to do with AI or UI design. Each keyword is
 * escaped before being dropped into a RegExp.
 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesKeyword(lowerValue: string, keyword: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
  return pattern.test(lowerValue);
}

function matchFreeText(value: string | null): KeywordRule | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => matchesKeyword(lower, kw))) return rule;
  }
  return null;
}

/**
 * Picks the single best signal available, in priority order:
 * field_of_interest (most specific — what they're actually studying/
 * doing) > freelance_skill > business_description > industry. Returns
 * null for every field when nothing recognizable was found — the caller
 * should fall back to showing everything unfiltered, not a guessed
 * default, since a wrong guess is worse than no suggestion.
 */
export function suggestGrowthDefaults(profile: TailoringProfile | null): {
  category: CourseCategory | null;
  prepFieldSlug: PrepFieldSlug | null;
} {
  if (!profile) return { category: null, prepFieldSlug: null };

  const candidates = [profile.field_of_interest, profile.freelance_skill, profile.business_description, profile.industry];

  for (const candidate of candidates) {
    const match = matchFreeText(candidate);
    if (match) return { category: match.category, prepFieldSlug: match.prepFieldSlug };
  }

  // skilled_or_unskilled alone isn't a field signal (it's a self-rating,
  // not a domain), so it never changes which category/field is suggested
  // — it exists in TailoringProfile only so future tailoring (e.g.
  // difficulty level) can use it without another plumbing change.
  return { category: null, prepFieldSlug: null };
}
