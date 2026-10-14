"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function followUser(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === targetUserId) throw new Error("You can't follow yourself");

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetUserId });

  // Ignore duplicate-follow conflicts (already following) so double
  // clicks / re-renders don't surface an error to the user.
  if (error && error.code !== "23505") throw new Error(error.message);

  revalidatePath(`/u/${targetUserId}`);
}

export async function unfollowUser(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId);

  if (error) throw new Error(error.message);

  revalidatePath(`/u/${targetUserId}`);
}
