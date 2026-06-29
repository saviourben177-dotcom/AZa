"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSkillResource(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("skill_resources").insert({
    skill_id: formData.get("skill_id") as string,
    title: formData.get("title") as string,
    provider: (formData.get("provider") as string) || null,
    url: formData.get("url") as string,
    resource_type: (formData.get("resource_type") as string) || "course",
    level: (formData.get("level") as string) || "beginner",
    duration_hours: formData.get("duration_hours") ? parseFloat(formData.get("duration_hours") as string) : null,
    is_free: formData.get("is_free") === "on",
    rating: formData.get("rating") ? parseFloat(formData.get("rating") as string) : null,
    curator_verified: formData.get("curator_verified") === "on",
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/growth/courses");
  revalidatePath("/curator/courses");
}

export async function deleteSkillResource(id: string) {
  const supabase = await createClient();
  await supabase.from("skill_resources").delete().eq("id", id);
  revalidatePath("/growth/courses");
  revalidatePath("/curator/courses");
}
