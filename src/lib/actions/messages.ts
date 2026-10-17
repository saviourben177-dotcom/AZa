"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Finds the existing direct conversation with `otherUserId`, or creates
 * one, then redirects to its thread. This is the entry point for the
 * "Message" button on a profile — it deliberately reuses the same
 * `messages` table/thread UI that team-finder already uses, via the new
 * `conversation_id` path, instead of building a second messaging system.
 */
export async function startOrOpenConversation(otherUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/u/${otherUserId}`);
  if (user.id === otherUserId) throw new Error("You can't message yourself");

  // conversations stores the pair with the smaller uuid first
  // (conversations_ordered_pair) so this lookup/insert never creates a
  // duplicate thread regardless of who started it.
  const [userAId, userBId] = [user.id, otherUserId].sort();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a_id", userAId)
    .eq("user_b_id", userBId)
    .maybeSingle();

  if (existing) redirect(`/messages/${existing.id}`);

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_a_id: userAId, user_b_id: userBId })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Could not start conversation");

  redirect(`/messages/${created.id}`);
}

export async function sendDirectMessage(conversationId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const body = (formData.get("body") as string)?.trim();
  if (!body) return;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/messages/${conversationId}`);
}
