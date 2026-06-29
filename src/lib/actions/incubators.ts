"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createIncubator(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("incubators").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    focus_area: (formData.get("focus_area") as string) || null,
    location: (formData.get("location") as string) || null,
    remote: formData.get("remote") === "on",
    application_url: (formData.get("application_url") as string) || null,
    deadline: (formData.get("deadline") as string) || null,
    curator_verified: formData.get("curator_verified") === "on",
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/businesses/incubators");
  revalidatePath("/curator/incubators");
}

export async function deleteIncubator(id: string) {
  const supabase = await createClient();
  await supabase.from("incubators").delete().eq("id", id);
  revalidatePath("/businesses/incubators");
  revalidatePath("/curator/incubators");
}
