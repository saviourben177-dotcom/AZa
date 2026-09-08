// src/lib/actions/admin/teams.ts
//
// Despite the filename (kept for continuity with the existing route
// /admin/teams), this file now creates TWO kinds of public.ideas rows:
//   - a normal Idea post (is_team = false): looking_for_collaborators=false,
//     no idea_roles. Appears in the same Ideas feed as user-posted ideas,
//     with the same interactions (upvotes, comments, saves) — nothing about
//     the feed or those interaction tables was touched, so this "just
//     works" the same way an organic post would.
//   - a Team post (is_team = true): looking_for_collaborators=true, plus
//     one or more idea_roles. Real users still join through the existing
//     Team Finder flow, untouched.
//
// IMPORTANT: neither mode creates join_requests rows, marks any role as
// filled, or simulates team membership. Real users join through the
// existing Team Finder flow, which is untouched by this tool.
//
// Why no seeded membership: join_requests has AFTER INSERT/UPDATE triggers
// that send real notifications (and, via a further trigger, real push
// notifications) to real users. There is no way to insert a "pre-accepted"
// join request without either firing those triggers with fabricated
// content, or suppressing triggers in a way that's fragile and easy to
// forget on a future migration. Rather than build around that, we simply
// don't seed membership — an idea with a strong pitch and real open roles
// is enough to make Team Finder feel populated at launch.
//
// Ownership: the idea's user_id can be set to EITHER the admin's own
// account, OR the @Aza editorial identity specifically — nothing else.
// This is enforced by two RLS policies on public.ideas:
//   - "ideas_owner_insert" (pre-existing, unmodified): user_id = auth.uid()
//   - "ideas_editorial_seed_insert" (added in
//     supabase/migrations/<timestamp>_allow_editorial_seeded_ideas.sql):
//     lets an admin/editorial caller insert an idea owned by a profile
//     with role='editorial' specifically — i.e. @Aza, not an arbitrary user.
// There is deliberately no way to seed an idea owned by any other real
// user's account through this tool.
//
// To make an @Aza-authored post read as official in the feed without any
// new column: set @Aza's profiles.full_name to something like "Aza
// Editorial Board" (one-time, outside this tool). The feed already renders
// full_name for the post's author via the existing public_profiles view —
// no schema change needed to get an attribution label.

"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./require-admin";
import { logAdminAction } from "./audit";
import { parseImportFile, validateImportRows } from "./import";

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

export async function createIdea(input: CreateIdeaInput) {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = createIdeaSchema.parse(input);

  // No client-side ownership check here beyond schema validation — RLS is
  // the actual gate. If owner_profile_id is neither the admin's own account
  // nor the @Aza editorial profile, the insert below is rejected by
  // Postgres (42501) rather than silently succeeding. That's intentional:
  // the DB, not this function, is the source of truth for who's allowed to
  // own a seeded idea.
  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .insert({
      user_id: parsed.owner_profile_id,
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      tags: parsed.tags ?? [],
      stage: parsed.stage,
      visibility: "public",
      looking_for_collaborators: parsed.is_team,
    })
    .select("id")
    .single();

  if (ideaError) throw ideaError;

  if (parsed.is_team && parsed.roles && parsed.roles.length > 0) {
    const rolesToInsert = parsed.roles.map((r) => ({
      idea_id: idea.id,
      role_name: r.role_name,
      slots_needed: r.slots_needed,
    }));

    const { error: rolesError } = await supabase.from("idea_roles").insert(rolesToInsert);
    if (rolesError) {
      // Best-effort cleanup: don't leave a team with zero roles dangling.
      await supabase.from("ideas").delete().eq("id", idea.id);
      throw rolesError;
    }

    await logAdminAction({
      action: "create",
      tableName: "ideas",
      recordId: idea.id,
      summary: `Created team "${parsed.title}" with ${rolesToInsert.length} open role(s)`,
    });
  } else {
    await logAdminAction({
      action: "create",
      tableName: "ideas",
      recordId: idea.id,
      summary: `Created idea post "${parsed.title}"`,
    });
  }

  return { ideaId: idea.id };
}

export async function deleteIdea(ideaId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // idea_roles.idea_id -> ideas.id is ON DELETE CASCADE (confirmed against
  // the live schema), so deleting the idea removes its roles automatically,
  // if it has any. This uses the existing "ideas_owner_or_curator_delete"
  // policy, which already allows curator/admin to delete any idea —
  // untouched by this migration.
  const { error: ideaError } = await supabase.from("ideas").delete().eq("id", ideaId);
  if (ideaError) throw ideaError;

  await logAdminAction({
    action: "delete",
    tableName: "ideas",
    recordId: ideaId,
    summary: `Deleted seeded idea ${ideaId}`,
  });
}

// --- Bulk import -------------------------------------------------------
//
// CSV supports flat Idea rows only (title, description, category, tags,
// stage) — no roles, since CSV has no clean way to express a nested array
// per row. Use JSON if any row needs is_team + roles. This constraint is
// surfaced in the import form, not just this comment.

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

/**
 * Preview step only — parses and validates, does not write to the DB.
 * CSV rows are coerced: tags/roles (if present as a JSON string in a CSV
 * cell) are parsed; anything that fails to parse is reported as an error
 * for that row rather than silently dropped.
 */
export async function previewIdeaImport(fileText: string, format: "csv" | "json") {
  await requireAdmin();

  let rawRows = parseImportFile(fileText, format);

  if (format === "csv") {
    // CSV cells are always strings — coerce known JSON-shaped columns and
    // the is_team boolean before validating, so a well-formed CSV doesn't
    // fail purely because "true" isn't the same as true to Zod.
    rawRows = rawRows.map((row) => {
      const r = row as Record<string, unknown>;
      const coerced: Record<string, unknown> = { ...r };
      if (typeof r.tags === "string" && r.tags.trim().length > 0) {
        coerced.tags = r.tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
      if (typeof r.is_team === "string") {
        coerced.is_team = r.is_team.trim().toLowerCase() === "true";
      }
      // roles intentionally NOT supported via CSV — see file header.
      // If a CSV row sets is_team=true without a roles column, the schema
      // refine below will correctly reject it with a clear message.
      return coerced;
    });
  }

  return validateImportRows(rawRows, bulkIdeaRowSchema);
}

export async function commitIdeaImport(rows: BulkIdeaRow[], ownerProfileId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const insertedIds: string[] = [];
  let teamCount = 0;

  // Sequential, not Promise.all: teams need a second insert (idea_roles)
  // tied to the first insert's id, and we want a clear failure point
  // (which row) rather than a partial Promise.all failure that's hard to
  // attribute back to a specific row.
  for (const row of rows) {
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .insert({
        user_id: ownerProfileId,
        title: row.title,
        description: row.description,
        category: row.category ?? null,
        tags: row.tags ?? [],
        stage: row.stage ?? "idea",
        visibility: "public",
        looking_for_collaborators: row.is_team ?? false,
      })
      .select("id")
      .single();

    if (ideaError) throw ideaError;

    if (row.is_team && row.roles && row.roles.length > 0) {
      const rolesToInsert = row.roles.map((r) => ({
        idea_id: idea.id,
        role_name: r.role_name,
        slots_needed: r.slots_needed,
      }));
      const { error: rolesError } = await supabase.from("idea_roles").insert(rolesToInsert);
      if (rolesError) {
        await supabase.from("ideas").delete().eq("id", idea.id);
        throw rolesError;
      }
      teamCount++;
    }

    insertedIds.push(idea.id);
  }

  await logAdminAction({
    action: "bulk_import",
    tableName: "ideas",
    summary: `Bulk imported ${insertedIds.length} post(s) (${teamCount} team(s), ${insertedIds.length - teamCount} idea(s))`,
  });

  return insertedIds;
}
