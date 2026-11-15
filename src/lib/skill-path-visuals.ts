import {
  Code2,
  Palette,
  BarChart3,
  PenTool,
  Briefcase,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps a skill_paths.cover_icon string (free text, curator-set) to a Lucide
 * icon. Same safe-fallback pattern as getSkillCategoryIcon in
 * skill-visuals.ts — cover_icon is plain text, not a DB enum, so an unknown
 * or missing value falls back gracefully instead of rendering undefined.
 */
const PATH_ICONS: Record<string, LucideIcon> = {
  "code-2": Code2,
  palette: Palette,
  "bar-chart-3": BarChart3,
  "pen-tool": PenTool,
  briefcase: Briefcase,
  sparkles: Sparkles,
};

export function getSkillPathIcon(coverIcon: string | null): LucideIcon {
  if (!coverIcon) return Target;
  return PATH_ICONS[coverIcon] ?? Target;
}

