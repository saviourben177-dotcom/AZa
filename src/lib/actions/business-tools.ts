"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBusinessTool(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("business_tools").insert({
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    tool_type: (formData.get("tool_type") as string) || "guide",
    url: formData.get("url") as string,
    category: (formData.get("category") as string) || null,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/businesses/tools");
  revalidatePath("/curator/tools");
}

export async function deleteBusinessTool(id: string) {
  const supabase = await createClient();
  await supabase.from("business_tools").delete().eq("id", id);
  revalidatePath("/businesses/tools");
  revalidatePath("/curator/tools");
}
