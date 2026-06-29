"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBusiness(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const logoFile = formData.get("logo") as File | null;
  let logoUrl: string | null = null;

  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("business-logos")
      .upload(path, logoFile);

    if (!uploadError) {
      const { data } = supabase.storage.from("business-logos").getPublicUrl(path);
      logoUrl = data.publicUrl;
    }
  }

  const { error } = await supabase.from("businesses").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    category: formData.get("category") as string,
    phone: (formData.get("phone") as string) || null,
    whatsapp: (formData.get("whatsapp") as string) || null,
    email: (formData.get("email") as string) || null,
    location: (formData.get("location") as string) || null,
    logo_url: logoUrl,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/businesses");
  revalidatePath("/curator/businesses");
}

export async function deleteBusiness(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/businesses");
  revalidatePath("/curator/businesses");
}
