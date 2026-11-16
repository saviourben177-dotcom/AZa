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

// One multiple-choice question. Graded entirely server-side (see
// submitQuizCheckpoint in skill-paths.ts) with no AI call — correct_index
// must point at a real option, and options should be concrete and
// mutually exclusive, not vague "it depends" choices.
export const quizQuestionInputSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correct_index: z.number().int().min(0),
  explanation: z.string().optional().nullable(),
});

export const skillCheckpointInputSchema = z
  .object({
    order: z.number().int().min(1),
    title: z.string().min(1).max(150),
    description: z.string().optional().nullable(),
    learning_points: z.array(z.string().min(1)).default([]),
    // The full lesson text for this checkpoint. Learning-style variants were
    // removed (the three "styles" were never actually written distinctly in
    // practice — every checkpoint only ever had one real version, and the
    // other two silently fell back to the one-line `description`). One real,
    // substantive lesson per checkpoint instead. Rewriting existing content
    // should never shrink it — paraphrase or quote the source, but keep the
    // same or greater depth; this field has no length cap for that reason.
    content: z.string().min(1, "content must not be empty"),
    is_final: z.boolean().default(false),
    // checkpoint_type decides what the learner sees and how it's graded:
    // 'lesson' = read + mark done, no grading; 'quiz' = multiple-choice
    // questions in quiz_questions, graded deterministically with no AI
    // call; 'submission' = free-text/link graded by AI against
    // evaluation_criteria, reserved for genuinely open-ended deliverables
    // (a real build, a written plan) that can't honestly be reduced to
    // multiple choice. requires_submission is kept in sync automatically
    // below so older code paths that still read it keep working.
    checkpoint_type: z.enum(["lesson", "quiz", "submission"]).default("submission"),
    quiz_questions: z.array(quizQuestionInputSchema).default([]),
    requires_submission: z.boolean().optional(),
    evaluation_criteria: z.string().optional().nullable(),
  })
  .superRefine((checkpoint, ctx) => {
    if (checkpoint.checkpoint_type === "quiz" && checkpoint.quiz_questions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "a quiz checkpoint must include at least one question in quiz_questions",
        path: ["quiz_questions"],
      });
    }
    for (const [i, q] of checkpoint.quiz_questions.entries()) {
      if (q.correct_index >= q.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `quiz_questions[${i}].correct_index (${q.correct_index}) is out of range for its ${q.options.length} options`,
          path: ["quiz_questions", i, "correct_index"],
        });
      }
    }
  })
  .transform((checkpoint) => ({
    ...checkpoint,
    // Keep the legacy boolean consistent with the new field rather than
    // trusting a value the caller may not have set: only 'submission'
    // checkpoints go through the AI-graded submission form.
    requires_submission: checkpoint.checkpoint_type === "submission",
  }));

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
  // Required credit line when this path's content is adapted from CC-BY
  // licensed source material (OpenStax, LibreTexts, Füllsack, Web Design
  // Primer, Rutherford/Univ. of Hawai'i OER, etc). CC BY 4.0 permits reuse
  // and resale but makes attribution a condition of that permission, not
  // optional — leave null only for paths with no external source material.
  source_attribution: z.string().optional().nullable(),
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
