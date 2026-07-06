"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createIdea(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/growth/ideas");

  const tags = (formData.get("skills_needed") as string)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const lookingForCollaborators = formData.get("looking_for_collaborators") === "on";

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      user_id: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: (formData.get("category") as string) || null,
      tags,
      visibility,
      looking_for_collaborators: lookingForCollaborators,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (lookingForCollaborators) {
    const roleNames = formData.getAll("role_name[]") as string[];
    const slotsNeeded = formData.getAll("slots_needed[]") as string[];

    const roles = roleNames
      .map((name, i) => ({
        idea_id: data.id,
        role_name: name.trim(),
        slots_needed: Math.max(1, Math.min(20, parseInt(slotsNeeded[i], 10) || 1)),
      }))
      .filter((r) => r.role_name.length > 0);

    if (roles.length > 0) {
      await supabase.from("idea_roles").insert(roles);
    }
  }

  revalidatePath("/growth/ideas");
  revalidatePath("/businesses/team-finder");
  redirect(lookingForCollaborators ? `/growth/ideas/posted?id=${data.id}` : `/growth/ideas/${data.id}`);
}

export async function toggleUpvote(ideaId: string, currentlyUpvoted: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (currentlyUpvoted) {
    await supabase.from("idea_upvotes").delete().eq("user_id", user.id).eq("idea_id", ideaId);
  } else {
    await supabase.from("idea_upvotes").upsert({ user_id: user.id, idea_id: ideaId });
  }

  revalidatePath("/growth/ideas");
  revalidatePath(`/growth/ideas/${ideaId}`);
}

export async function updateIdeaStage(ideaId: string, stage: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ideas").update({ stage, updated_at: new Date().toISOString() }).eq("id", ideaId);
  if (error) throw new Error(error.message);
  revalidatePath(`/growth/ideas/${ideaId}`);
}

export async function deleteIdea(ideaId: string) {
  const supabase = await createClient();
  await supabase.from("ideas").delete().eq("id", ideaId);
  revalidatePath("/growth/ideas");
  redirect("/growth/ideas");
}
