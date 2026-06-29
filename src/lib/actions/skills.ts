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

export async function updateSkillProgress(skillId: string, progressPercent: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_skills")
    .update({ progress_percent: Math.max(0, Math.min(100, progressPercent)) })
    .eq("user_id", user.id)
    .eq("skill_id", skillId);

  if (error) throw new Error(error.message);
  revalidatePath("/growth");
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
