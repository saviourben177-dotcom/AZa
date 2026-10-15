import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_public")
    .eq("id", user.id)
    .single();

  return <SettingsForm initialIsPublic={profile?.is_public ?? true} />;
}
