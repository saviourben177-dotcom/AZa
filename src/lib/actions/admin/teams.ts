// src/lib/actions/admin/teams.ts
//
// IMPORTANT: this intentionally does NOT create join_requests rows, does NOT
// mark any role as filled, and does NOT simulate team membership. It only
// creates the idea (looking_for_collaborators = true) and its open
// idea_roles. Real users join through the existing Team Finder flow, which
// is untouched by this tool.
//
// Why: join_requests has AFTER INSERT/UPDATE triggers that send real
// notifications (and, via a further trigger, real push notifications) to
// real users. There is no way to insert a "pre-accepted" join request
// without either firing those triggers with fabricated content, or
// suppressing triggers in a way that's fragile and easy to forget on a
// future migration. Rather than build around that, we simply don't seed
// membership — an idea with a strong pitch and real open roles is enough
// to make Team Finder feel populated at launch.
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

"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./require-admin";
import { logAdminAction } from "./audit";

export const teamRoleSchema = z.object({
  role_name: z.string().min(1).max(80),
  slots_needed: z.number().int().min(1).max(20).default(1),
});

export const createTeamSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(3000),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  stage: z.enum(["idea", "validation", "building", "launched"]).default("idea"),
  owner_profile_id: z.string().uuid(),
  roles: z.array(teamRoleSchema).min(1, "A team needs at least one open role"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export async function createTeam(input: CreateTeamInput) {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = createTeamSchema.parse(input);

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
      looking_for_collaborators: true,
    })
    .select("id")
    .single();

  if (ideaError) throw ideaError;

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

  return { ideaId: idea.id };
}

export async function deleteTeam(ideaId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // idea_roles.idea_id -> ideas.id is ON DELETE CASCADE (confirmed against
  // the live schema), so deleting the idea removes its roles automatically.
  // This uses the existing "ideas_owner_or_curator_delete" policy, which
  // already allows curator/admin to delete any idea — untouched by this
  // migration.
  const { error: ideaError } = await supabase.from("ideas").delete().eq("id", ideaId);
  if (ideaError) throw ideaError;

  await logAdminAction({
    action: "delete",
    tableName: "ideas",
    recordId: ideaId,
    summary: `Deleted seeded team ${ideaId}`,
  });
}
