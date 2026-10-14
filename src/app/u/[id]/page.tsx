import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FollowButton from "@/components/follow-button";
import MessageButton from "@/components/profile/message-button";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/u/${id}`);

  // Your own profile lives at /profile.
  if (user.id === id) redirect("/profile");

  // Private accounts resolve to "not found" so their profile can't be viewed.
  const { data: isPublic } = await supabase.rpc("is_profile_public", { p_user_id: id });
  if (!isPublic) notFound();

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("id, full_name, avatar_url")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const name = profile.full_name ?? "Aza user";

  const [{ count: followerCount }, { count: followingCount }, { data: followRow }] =
    await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", id)
        .maybeSingle(),
    ]);

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover ring-1 ring-line-strong" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-aza-light text-aza ring-1 ring-line-strong">
            <span className="font-display text-[34px] font-bold">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h1 className="mt-4 font-display text-[21px] font-bold text-ink">{name}</h1>

        <div className="mt-3 flex items-center gap-6 text-[13px] text-ink/60">
          <p>
            <span className="font-bold text-ink">{followerCount ?? 0}</span> Followers
          </p>
          <p>
            <span className="font-bold text-ink">{followingCount ?? 0}</span> Following
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2.5">
        <FollowButton targetUserId={id} initialFollowing={!!followRow} />
        <MessageButton targetUserId={id} />
      </div>
    </div>
  );
}
