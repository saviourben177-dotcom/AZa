"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addUserSkill(skillId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_skills")
    .upsert({ user_id: user.id, skill_id: skillId }, { onConflict: "user_id,skill_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/growth");
}

/**
 * Recomputes user_skills.progress_percent for one (user, skill) pair from
 * actual completion records in user_skill_resources — completed resources
 * for that skill / total resources that exist for that skill, rounded to
 * the nearest whole percent. Called after every mark-complete/uncomplete,
 * so the stored percent is always a reflection of real activity rather
 * than a number a button happened to set.
 *
 * A skill with zero resources yet (skill_resources is empty for it)
 * resolves to 0% rather than dividing by zero or leaving the prior value
 * stale.
 */
async function recomputeSkillProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  skillId: string
) {
  const [{ count: totalCount }, { count: completedCount }] = await Promise.all([
    supabase.from("skill_resources").select("id", { count: "exact", head: true }).eq("skill_id", skillId),
    supabase
      .from("user_skill_resources")
      .select("resource_id, skill_resources!inner(skill_id)", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("skill_resources.skill_id", skillId),
  ]);

  const total = totalCount ?? 0;
  const completed = completedCount ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { error } = await supabase
    .from("user_skills")
    .update({ progress_percent: percent })
    .eq("user_id", userId)
    .eq("skill_id", skillId);

  if (error) throw new Error(error.message);
  return percent;
}

/**
 * Marks one skill_resources row complete for the current user and
 * recomputes that skill's real progress percentage. This is the
 * replacement for the old flat updateSkillProgress(+10%) button — progress
 * now only moves when a specific, real resource is marked done.
 */
export async function markResourceComplete(skillId: string, resourceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Completing a course is a strong enough signal to auto-track the skill
  // if the user hasn't explicitly added it yet — otherwise the completion
  // would recompute progress_percent for a user_skills row that doesn't
  // exist, silently affecting 0 rows.
  const { error: trackError } = await supabase
    .from("user_skills")
    .upsert({ user_id: user.id, skill_id: skillId }, { onConflict: "user_id,skill_id", ignoreDuplicates: true });
  if (trackError) throw new Error(trackError.message);

  const { error } = await supabase
    .from("user_skill_resources")
    .upsert({ user_id: user.id, resource_id: resourceId }, { onConflict: "user_id,resource_id" });
  if (error) throw new Error(error.message);

  const percent = await recomputeSkillProgress(supabase, user.id, skillId);
  revalidatePath("/growth");
  revalidatePath("/growth/skills");
  revalidatePath("/growth/courses");
  return percent;
}

/** Undoes a completion — lets a user correct a mistaken mark-complete. */
export async function markResourceIncomplete(skillId: string, resourceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_skill_resources")
    .delete()
    .eq("user_id", user.id)
    .eq("resource_id", resourceId);
  if (error) throw new Error(error.message);

  const percent = await recomputeSkillProgress(supabase, user.id, skillId);
  revalidatePath("/growth");
  revalidatePath("/growth/skills");
  revalidatePath("/growth/courses");
  return percent;
}

export async function removeUserSkill(skillId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("user_skills").delete().eq("user_id", user.id).eq("skill_id", skillId);
  revalidatePath("/growth");
}
