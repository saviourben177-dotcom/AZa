import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EditProfileForm from "./edit-profile-form";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile/edit");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <EditProfileForm
      currentName={profile?.full_name ?? ""}
      currentAvatarUrl={profile?.avatar_url ?? null}
      email={user.email ?? ""}
    />
  );
}
