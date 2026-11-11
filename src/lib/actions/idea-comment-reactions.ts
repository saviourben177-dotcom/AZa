"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CommentReaction } from "@/lib/types";

/**
 * Toggle a like/dislike on a comment.
 * - If the user has no reaction, or a different reaction, insert/overwrite with `reaction`.
 * - If the user already has this exact reaction, remove it (un-like / un-dislike).
 */
export async function toggleCommentReaction(
  ideaId: string,
  commentId: string,
  reaction: CommentReaction,
  currentReaction: CommentReaction | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (currentReaction === reaction) {
    // Same reaction tapped again -> remove it
    const { error } = await supabase.from("idea_comment_reactions").delete().eq("user_id", user.id).eq("comment_id", commentId);
    if (error) throw new Error(error.message);
  } else {
    // No reaction yet, or switching from like<->dislike -> upsert
    const { error } = await supabase.from("idea_comment_reactions").upsert({
      user_id: user.id,
      comment_id: commentId,
      reaction,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/growth/ideas/${ideaId}`);
}
