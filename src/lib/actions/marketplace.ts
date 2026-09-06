"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MarketplaceListingType } from "@/lib/types";
import { COMMON_CODES } from "@/lib/currencies";

export async function createListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/businesses/marketplace");

  const priceAmount = formData.get("price_amount") as string;
  const priceKobo = priceAmount ? Math.round(parseFloat(priceAmount) * 100) : null;
  const rawCurrency = (formData.get("currency") as string)?.toLowerCase();
  const currency = COMMON_CODES.includes(rawCurrency) ? rawCurrency : "ngn";

  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("marketplace-images").upload(path, imageFile);
    if (!uploadError) {
      const { data } = supabase.storage.from("marketplace-images").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }
  }

  const { error } = await supabase.from("marketplace_listings").insert({
    user_id: user.id,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    listing_type: formData.get("listing_type") as MarketplaceListingType,
    category: (formData.get("category") as string) || null,
    price_kobo: priceKobo,
    currency,
    image_url: imageUrl,
    location: (formData.get("location") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    contact_whatsapp: (formData.get("contact_whatsapp") as string) || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/businesses/marketplace");
  redirect("/businesses/marketplace");
}

export async function updateListingStatus(id: string, status: "active" | "sold" | "closed") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketplace_listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/businesses/marketplace");
}

export async function deleteListing(id: string) {
  const supabase = await createClient();
  await supabase.from("marketplace_listings").delete().eq("id", id);
  revalidatePath("/businesses/marketplace");
}
