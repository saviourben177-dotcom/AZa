"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ApplicationStatus } from "@/lib/types";

const VALID_STATUSES: ApplicationStatus[] = ["saved", "applied", "interviewing", "rejected", "accepted"];

export async function updateApplicationStatus(opportunityId: string, status: ApplicationStatus) {
  if (!VALID_STATUSES.includes(status)) throw new Error("Invalid status");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("saved_opportunities")
    .update({ status })
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId);

  if (error) throw new Error(error.message);

  revalidatePath("/profile/saved");
  revalidatePath("/profile");
  revalidatePath("/growth");
}
