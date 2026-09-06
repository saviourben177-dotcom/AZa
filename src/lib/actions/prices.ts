"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductCategory } from "@/lib/types";
import { COMMON_CODES } from "@/lib/currencies";

export async function upsertPrice(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const amount = parseFloat(formData.get("price_amount") as string);
  const priceKobo = Math.round(amount * 100);
  const rawCurrency = (formData.get("currency") as string)?.toLowerCase();
  const currency = COMMON_CODES.includes(rawCurrency) ? rawCurrency : "ngn";

  const { error } = await supabase.from("prices").upsert(
    {
      product_name: formData.get("product_name") as string,
      category: formData.get("category") as ProductCategory,
      unit: (formData.get("unit") as string) || null,
      price_kobo: priceKobo,
      currency,
      last_updated_by: user.id,
      last_updated_at: new Date().toISOString(),
    },
    { onConflict: "product_name" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/prices");
  revalidatePath("/curator/prices");
}

export async function deletePrice(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("prices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/prices");
  revalidatePath("/curator/prices");
}
