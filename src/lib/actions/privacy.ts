"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setAccountPublic(isPublic: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ is_public: isPublic })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile/settings");
  revalidatePath(`/u/${user.id}`);
}
