// src/lib/actions/admin/team-schema.ts
//
// Plain schema definitions for teams.ts, kept out of that file because
// teams.ts has "use server" — a "use server" module may only export async
// functions, so non-function exports like these z.object() schemas would
// be stripped/mangled by the server-actions bundling transform in
// production if a client component ever imported them directly (see the
// businesses.ts / business-schema.ts split, which hit this in production).

import { z } from "zod";

export const teamRoleSchema = z.object({
  role_name: z.string().min(1).max(80),
  slots_needed: z.number().int().min(1).max(20).default(1),
});

export const createIdeaSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(3000),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  stage: z.enum(["idea", "validation", "building", "launched"]).default("idea"),
  owner_profile_id: z.string().uuid(),
  is_team: z.boolean().default(false),
  // Required only when is_team is true — enforced below with a refine,
  // since Zod's per-field "required if" needs a cross-field check.
  roles: z.array(teamRoleSchema).optional(),
}).refine(
  (data) => !data.is_team || (data.roles && data.roles.length > 0),
  { message: "A team needs at least one open role", path: ["roles"] }
);

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;

export const bulkIdeaRowSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(3000),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  stage: z.enum(["idea", "validation", "building", "launched"]).optional(),
  is_team: z.boolean().optional(),
  roles: z.array(teamRoleSchema).optional(),
}).refine(
  (data) => !data.is_team || (data.roles && data.roles.length > 0),
  { message: "A team row needs at least one open role", path: ["roles"] }
);

export type BulkIdeaRow = z.infer<typeof bulkIdeaRowSchema>;
