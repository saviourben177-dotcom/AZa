"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function followUser(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === targetId) throw new Error("You can't follow yourself");

  const { error } = await supabase
    .from("follows")
    .upsert({ follower_id: user.id, following_id: targetId }, { onConflict: "follower_id,following_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/u/${targetId}`);
  revalidatePath("/profile/following");
}

export async function unfollowUser(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);
  if (error) throw new Error(error.message);

  revalidatePath(`/u/${targetId}`);
  revalidatePath("/profile/following");
}
