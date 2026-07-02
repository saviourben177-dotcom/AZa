"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/edit");

  const fullName = (formData.get("full_name") as string)?.trim();
  if (!fullName) {
    throw new Error("Display name can't be empty.");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  let avatarUrl = currentProfile?.avatar_url ?? null;

  const avatarFile = formData.get("avatar") as File | null;
  const removeAvatar = formData.get("remove_avatar") === "1";

  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = data.publicUrl;
  } else if (removeAvatar) {
    avatarUrl = null;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  redirect("/profile");
}
