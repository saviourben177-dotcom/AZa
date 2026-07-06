"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function sendJoinRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ideaId = formData.get("idea_id") as string;
  if (!user) redirect(`/login?next=/businesses/team-finder/${ideaId}`);

  const roleId = formData.get("role_id") as string;
  const experience = ((formData.get("experience") as string) || "").trim();
  const why = (formData.get("message") as string).trim();
  const message = experience ? `${why}\n\nExperience: ${experience}` : why;
  const portfolioUrl = (formData.get("portfolio_url") as string) || null;

  const { error } = await supabase.from("join_requests").insert({
    idea_id: ideaId,
    role_id: roleId,
    requester_id: user.id,
    message: message.slice(0, 1500),
    portfolio_url: portfolioUrl,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/businesses/team-finder/${ideaId}`);
  revalidatePath("/businesses/team-finder/requests");
  redirect(`/businesses/team-finder/${ideaId}?requested=1`);
}

export async function respondToJoinRequest(
  requestId: string,
  ideaId: string,
  decision: "accepted" | "declined"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: request, error: fetchError } = await supabase
    .from("join_requests")
    .select("id, role_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) throw new Error("Request not found");

  const { error } = await supabase
    .from("join_requests")
    .update({ status: decision, responded_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) throw new Error(error.message);

  if (decision === "accepted" && request.status !== "accepted") {
    const { data: role } = await supabase
      .from("idea_roles")
      .select("slots_filled")
      .eq("id", request.role_id)
      .single();

    if (role) {
      await supabase
        .from("idea_roles")
        .update({ slots_filled: role.slots_filled + 1 })
        .eq("id", request.role_id);
    }
  }

  revalidatePath("/businesses/team-finder/requests");
  revalidatePath(`/businesses/team-finder/${ideaId}`);
}

export async function sendMessage(joinRequestId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const body = (formData.get("body") as string)?.trim();
  if (!body) return;

  const { error } = await supabase.from("messages").insert({
    join_request_id: joinRequestId,
    sender_id: user.id,
    body,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/businesses/team-finder/messages/${joinRequestId}`);
}
