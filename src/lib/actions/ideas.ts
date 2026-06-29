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

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      user_id: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: (formData.get("category") as string) || null,
      tags,
      visibility,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/growth/ideas");
  redirect(`/growth/ideas/${data.id}`);
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
