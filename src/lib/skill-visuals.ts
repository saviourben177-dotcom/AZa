import { Sparkles, Briefcase, Code2, Palette, Hammer, TrendingUp, Target, type LucideIcon } from "lucide-react";
import type { SkillCategory } from "@/lib/types";

/**
 * One icon + display label per skill category, same pattern as
 * CATEGORY_IMAGE/CATEGORY_EYEBROW in category-visuals.ts. Skills don't have
 * a per-row icon column in the DB (and don't need one — 6 stable categories
 * is a code-level lookup, not schema), so this is the single place to
 * change a category's icon or label.
 *
 * NOTE: the `skills.category` DB column is a plain text column, not a
 * Postgres enum — so nothing at the schema level guarantees a row's
 * category is one of the 6 values below. As of this writing all 16 seeded
 * rows are (verified via direct query), but a future row with a typo'd or
 * new category string would otherwise fall through these lookups as
 * `undefined`. getSkillCategoryIcon()/getSkillCategoryLabel() below are the
 * safe accessors — use those instead of indexing the Records directly.
 */
export const SKILL_CATEGORY_ICON: Record<SkillCategory, LucideIcon> = {
  ai: Sparkles,
  business: Briefcase,
  coding: Code2,
  design: Palette,
  trades_diy: Hammer,
  trading: TrendingUp,
};

export const SKILL_CATEGORY_LABEL: Record<SkillCategory, string> = {
  ai: "AI & Automation",
  business: "Business",
  coding: "Coding",
  design: "Design",
  trades_diy: "Trades & DIY",
  trading: "Trading",
};

/** Display order for grouped sections — deliberate, not alphabetical. */
export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
  "coding",
  "design",
  "ai",
  "business",
  "trading",
  "trades_diy",
];

const FALLBACK_ICON: LucideIcon = Target;
const FALLBACK_LABEL = "Other";

/** Safe lookup — falls back gracefully instead of rendering `undefined` if a row's category isn't one of the known 6 (see NOTE above). */
export function getSkillCategoryIcon(category: string): LucideIcon {
  return SKILL_CATEGORY_ICON[category as SkillCategory] ?? FALLBACK_ICON;
}

/** Safe lookup — see getSkillCategoryIcon. */
export function getSkillCategoryLabel(category: string): string {
  return SKILL_CATEGORY_LABEL[category as SkillCategory] ?? FALLBACK_LABEL;
}
