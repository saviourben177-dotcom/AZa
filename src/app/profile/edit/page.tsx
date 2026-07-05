import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Edit Profile</h1>
      </div>
      <p className="mt-2 text-[12.5px] text-ink/55">Update your display name and photo.</p>

      <div className="mt-6">
        <EditProfileForm
          currentName={profile?.full_name ?? ""}
          currentAvatarUrl={profile?.avatar_url ?? null}
          email={user.email ?? ""}
        />
      </div>
    </div>
  );
}
