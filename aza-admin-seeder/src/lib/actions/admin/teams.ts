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
// Ownership: the idea's user_id is set to whichever profile the admin
// selects — normally the @Aza editorial identity, but any existing real
// profile can be chosen (e.g. if a real user should appear as the team's
// point of contact). ideas.user_id has no RLS carve-out for curator/editorial
// insert today (by design — see the original architecture review), so this
// action writes as the ADMIN'S OWN authenticated session and explicitly sets
// user_id to the target profile via a service-independent path: the insert
// itself, subject to normal ideas RLS.
//
// NOTE: public.ideas' existing INSERT policy is owner-only
// (`user_id = auth.uid()`). This tool does not add a curator/editorial
// bypass for that (per the "avoid changing existing architecture
// unnecessarily" instruction), so in practice the admin should create
// seeded teams under their OWN account (if it holds role='admin') or under
// an account they are legitimately acting for. If you want @Aza to be able
// to own seeded ideas directly, that requires one additional narrow INSERT
// policy on public.ideas — deliberately NOT added here; flag it if you hit
// this limitation in practice and we'll add the smallest possible policy.

"use server";

import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
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
  const admin = await requireAdmin();
  const supabase = createServerClient();

  const parsed = createTeamSchema.parse(input);

  // Safety check with a clear error, since ideas' INSERT policy requires
  // user_id = auth.uid() — see file header. This surfaces the constraint
  // as a readable message instead of a raw RLS 42501 error.
  if (parsed.owner_profile_id !== admin.userId) {
    throw new Error(
      "Team ownership is currently limited to the admin's own account " +
        "(public.ideas only allows self-owned inserts). To let @Aza or " +
        "another profile own seeded teams directly, a narrow additional " +
        "INSERT policy on public.ideas is required — this was deliberately " +
        "not added in v1. Ask for it if you need this."
    );
  }

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
  const supabase = createServerClient();

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
