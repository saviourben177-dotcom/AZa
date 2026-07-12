import type { OpportunityCategory } from "@/lib/types";

/**
 * opportunities.logo_url does not exist in the schema (confirmed via
 * screen-mapping doc + live schema check). Rather than fabricate a logo,
 * every opportunity falls back to a colored category glyph tile — the
 * nearest existing equivalent (same pattern already used for Skills rows).
 * Swap this for a real <Image src={logo_url}> the moment the column ships.
 */
const CATEGORY_STYLE: Record<
  OpportunityCategory,
  { bg: string; fg: string; glyph: string }
> = {
  scholarship: { bg: "bg-tag-blue-bg", fg: "text-tag-blue", glyph: "🎓" },
  grant: { bg: "bg-tag-teal-bg", fg: "text-tag-teal", glyph: "💠" },
  hackathon: { bg: "bg-tag-purple-bg", fg: "text-tag-purple", glyph: "⚡" },
  fellowship: { bg: "bg-aza-light", fg: "text-aza", glyph: "🌱" },
  internship: { bg: "bg-tag-orange-bg", fg: "text-tag-orange", glyph: "💼" },
  competition: { bg: "bg-tag-pink-bg", fg: "text-tag-pink", glyph: "🏆" },
  job_gig: { bg: "bg-tag-blue-bg", fg: "text-tag-blue", glyph: "🧰" },
};

export default function CategoryIconTile({
  category,
  size = 44,
}: {
  category: OpportunityCategory;
  size?: number;
}) {
  const style = CATEGORY_STYLE[category];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-card-sm ${style.bg}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      <span className={style.fg}>{style.glyph}</span>
    </div>
  );
}
