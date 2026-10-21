"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createIdea(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/growth/ideas");

  // skills_needed is not currently a field in the idea form.
  // Keep tags empty unless the form explicitly supplies them.
  const skillsNeeded = formData.get("skills_needed");
  const tags =
    typeof skillsNeeded === "string"
      ? skillsNeeded
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const lookingForCollaborators = formData.get("looking_for_collaborators") === "on";

  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("idea-images").upload(path, imageFile);
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from("idea-images").getPublicUrl(path);
      imageUrl = publicUrlData.publicUrl;
    }
  }

  const rawLinkUrl = (formData.get("link_url") as string)?.trim();
  const linkUrl = rawLinkUrl ? (/^https?:\/\//i.test(rawLinkUrl) ? rawLinkUrl : `https://${rawLinkUrl}`) : null;

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      user_id: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: (formData.get("category") as string) || null,
      tags,
      visibility,
      looking_for_collaborators: lookingForCollaborators,
      image_url: imageUrl,
      link_url: linkUrl,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (lookingForCollaborators) {
    const roleNames = formData.getAll("role_name[]") as string[];
    const slotsNeeded = formData.getAll("slots_needed[]") as string[];

    const roles = roleNames
      .map((name, i) => ({
        idea_id: data.id,
        role_name: name.trim(),
        slots_needed: Math.max(1, Math.min(20, parseInt(slotsNeeded[i], 10) || 1)),
      }))
      .filter((r) => r.role_name.length > 0);

    if (roles.length > 0) {
      await supabase.from("idea_roles").insert(roles);
    }
  }

  revalidatePath("/growth/ideas");
  revalidatePath("/businesses/team-finder");
  redirect(lookingForCollaborators ? `/growth/ideas/posted?id=${data.id}` : `/growth/ideas/${data.id}`);
}

export async function toggleUpvote(ideaId: string, currentlyUpvoted: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (currentlyUpvoted) {
    await supabase.from("idea_upvotes").delete().eq("user_id", user.id).eq("idea_id", ideaId);
  } else {
    await supabase.from("idea_upvotes").upsert({ user_id: user.id, idea_id: ideaId });
  }

  revalidatePath("/growth/ideas");
  revalidatePath(`/growth/ideas/${ideaId}`);
}

export async function updateIdeaStage(ideaId: string, stage: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ideas").update({ stage, updated_at: new Date().toISOString() }).eq("id", ideaId);
  if (error) throw new Error(error.message);
  revalidatePath(`/growth/ideas/${ideaId}`);
}

export async function deleteIdea(ideaId: string, redirectTo: string = "/growth/ideas") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/growth/ideas");

  // Only the idea's own author may delete it. Scoping the delete with
  // .eq("user_id", user.id) means the query matches zero rows (and silently
  // does nothing) for anyone else, rather than deleting someone else's post.
  await supabase.from("ideas").delete().eq("id", ideaId).eq("user_id", user.id);
  revalidatePath("/growth/ideas");
  revalidatePath("/businesses/team-finder");
  redirect(redirectTo);
}

export async function toggleSaveIdea(ideaId: string, currentlySaved: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (currentlySaved) {
    await supabase.from("saved_ideas").delete().eq("user_id", user.id).eq("idea_id", ideaId);
  } else {
    await supabase.from("saved_ideas").upsert({ user_id: user.id, idea_id: ideaId });
  }

  revalidatePath("/growth/ideas");
  revalidatePath(`/growth/ideas/${ideaId}`);
  revalidatePath("/profile/saved");
}
