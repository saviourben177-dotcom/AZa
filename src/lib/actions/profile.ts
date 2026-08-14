"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData): Promise<{ success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/edit");

  const fullName = (formData.get("full_name") as string)?.trim();
  if (!fullName) {
    throw new Error("Display name can't be empty.");
  }

  const { data: currentProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("updateProfile: failed to load current profile", {
      userId: user.id,
      code: fetchError.code,
      message: fetchError.message,
    });
    throw new Error("Could not load your profile. Please try again.");
  }

  let avatarUrl = currentProfile?.avatar_url ?? null;

  const avatarFile = formData.get("avatar") as File | null;
  const removeAvatar = formData.get("remove_avatar") === "1";

  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    if (uploadError) {
      console.error("updateProfile: avatar upload failed", {
        userId: user.id,
        message: uploadError.message,
      });
      throw new Error(uploadError.message || "Could not upload your photo. Please try again.");
    }

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

  if (error) {
    console.error("updateProfile failed", {
      userId: user.id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message || "Could not save your profile. Please try again.");
  }

  revalidatePath("/profile");
  return { success: true };
}
