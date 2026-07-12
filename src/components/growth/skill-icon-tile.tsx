const PALETTE = [
  { bg: "bg-tag-purple-bg", fg: "text-tag-purple" },
  { bg: "bg-tag-blue-bg", fg: "text-tag-blue" },
  { bg: "bg-tag-teal-bg", fg: "text-tag-teal" },
  { bg: "bg-tag-orange-bg", fg: "text-tag-orange" },
  { bg: "bg-tag-pink-bg", fg: "text-tag-pink" },
];

const GLYPHS: Record<string, string> = {
  design: "🎨",
  development: "💻",
  programming: "💻",
  business: "📊",
  data: "📈",
  communication: "💬",
  marketing: "📣",
  trades: "🔧",
  ai: "✨",
  trading: "📉",
};

/**
 * skills.category is free-text with no fixed enum, so this hashes the string
 * to a stable palette slot rather than requiring an exhaustive mapping —
 * every category gets a consistent, distinct tile without needing a schema
 * change to add an icon/color column.
 */
export default function SkillIconTile({ category, size = 44 }: { category: string; size?: number }) {
  const key = category.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const style = PALETTE[hash % PALETTE.length];
  const glyph = GLYPHS[key] ?? "⭐";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-card-sm ${style.bg}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      <span className={style.fg}>{glyph}</span>
    </div>
  );
}
