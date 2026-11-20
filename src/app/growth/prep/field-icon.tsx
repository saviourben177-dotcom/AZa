import { Code2, BrainCircuit, PenTool, Briefcase, Users, GraduationCap, type LucideIcon } from "lucide-react";

/**
 * prep_fields.icon stores a lucide-react export name as plain text (set
 * by the seed migration / future admin tooling), not a component — this
 * resolves that name to the actual icon, falling back to a generic one
 * for any value that doesn't match (e.g. a typo in a future admin entry)
 * rather than crashing the page.
 */
const ICONS: Record<string, LucideIcon> = {
  Code2,
  BrainCircuit,
  PenTool,
  Briefcase,
  Users,
};

export function resolveFieldIcon(name: string | null): LucideIcon {
  if (name && ICONS[name]) return ICONS[name];
  return GraduationCap;
}
