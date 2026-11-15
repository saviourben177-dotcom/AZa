// src/lib/actions/admin/skill-path-schema.ts
//
// Plain data + schema shared between the admin skill-paths server actions
// (skill-paths.ts, "use server") and client components (the import form).
// See business-schema.ts for why this must NOT have "use server".
//
// Import shape: ONE JSON file is a single skill path plus all of its
// checkpoints, nested — this is what lets an LLM write one self-contained
// file per sector/path and have it land in the right place automatically:
// the path is matched/created by `slug` (unique in the DB), and each
// checkpoint is matched/created by (path, order) (also unique in the DB).
// Nothing in this format requires knowing any database UUID ahead of time.

import { z } from "zod";

export const skillCheckpointInputSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1).max(150),
  description: z.string().optional().nullable(),
  learning_points: z.array(z.string().min(1)).default([]),
  // The full lesson text for this checkpoint. Learning-style variants were
  // removed (the three "styles" were never actually written distinctly in
  // practice — every checkpoint only ever had one real version, and the
  // other two silently fell back to the one-line `description`). One real,
  // substantive lesson per checkpoint instead.
  content: z.string().min(1, "content must not be empty"),
  is_final: z.boolean().default(false),
  requires_submission: z.boolean().default(true),
  evaluation_criteria: z.string().optional().nullable(),
});

export type SkillCheckpointInput = z.infer<typeof skillCheckpointInputSchema>;

// Mirrors the DB constraints on public.skill_paths exactly (see
// 20261025182828_skills_paths_feature.sql), so a row that passes this
// schema is guaranteed to pass the table's CHECK constraints too.
export const skillPathInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1).max(150),
  category: z.string().min(1),
  summary: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  cover_icon: z.string().optional().nullable(),
  output_kind: z.enum(["artifact", "capability"]).default("artifact"),
  tier: z.enum(["free", "premium"]).default("free"),
  estimated_weeks: z.number().int().positive().optional().nullable(),
  sort_order: z.number().int().default(0),
  is_published: z.boolean().default(true),
  checkpoints: z
    .array(skillCheckpointInputSchema)
    .min(1, "a skill path must include at least one checkpoint")
    .superRefine((checkpoints, ctx) => {
      const orders = checkpoints.map((c) => c.order);
      const dupes = orders.filter((o, i) => orders.indexOf(o) !== i);
      if (dupes.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate checkpoint order number(s) within this path: ${Array.from(new Set(dupes)).join(", ")}`,
        });
      }
      const finals = checkpoints.filter((c) => c.is_final);
      if (finals.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "a skill path can have at most one is_final checkpoint",
        });
      }
    }),
});

export type SkillPathInput = z.infer<typeof skillPathInputSchema>;
