// src/lib/actions/admin/idea-library-schema.ts
//
// Plain schema kept out of idea-library.ts because that file has
// "use server" — a "use server" module may only export async functions,
// so a non-function export like ideaLibrarySchema would be
// stripped/mangled by the server-actions bundling transform in production
// if a client component ever imported it directly (see the
// businesses.ts / business-schema.ts split, which hit this in production).

import { z } from "zod";

// Mirrors public.idea_library's column constraints. Enum/impact-level
// fields are optional in this v1 form — the existing curator UI (if any)
// or a follow-up edit can fill in the scorecard fields later.
export const ideaLibrarySchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  summary: z.string().max(500).optional().nullable(),
  description: z.string().min(1),
  is_novel_flag: z.boolean().optional(),
  competitors: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
  mvp_features: z.array(z.string()).optional(),
  validation_checklist: z.array(z.string()).optional(),
  funding_options: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
  capital_required: z.enum(["low", "medium", "high"]).optional().nullable(),
  time_to_mvp: z.string().optional().nullable(),
  market_competition: z.enum(["low", "medium", "high"]).optional().nullable(),
  validation_risk: z.enum(["low", "medium", "high"]).optional().nullable(),
  revenue_potential: z.enum(["low", "medium", "high"]).optional().nullable(),
  suitable_for: z.enum(["beginner", "intermediate", "advanced"]).optional().nullable(),
  confidence: z.enum(["high", "medium", "low"]).optional().nullable(),
  confidence_rationale: z.string().optional().nullable(),
});

export type IdeaLibraryInput = z.infer<typeof ideaLibrarySchema>;
