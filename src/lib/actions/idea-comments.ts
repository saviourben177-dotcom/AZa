"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createIdeaComment(ideaId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = body.trim();
  if (trimmed.length === 0) throw new Error("Comment cannot be empty");
  if (trimmed.length > 1000) throw new Error("Comment too long");

  const { error } = await supabase.from("idea_comments").insert({
    idea_id: ideaId,
    user_id: user.id,
    body: trimmed,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/growth/ideas/${ideaId}`);
}

export async function deleteIdeaComment(commentId: string, ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("idea_comments").delete().eq("id", commentId).eq("user_id", user.id);

  revalidatePath(`/growth/ideas/${ideaId}`);
}
