import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapDbIdeaToPrototype } from "@/lib/aza/mappers";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Empty } from "@/components/aza/kit";
import { IdeaCard } from "@/components/aza/idea-card";
import FollowButton from "./follow-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("public_profiles")
    .select("full_name")
    .eq("id", id)
    .maybeSingle();
  return { title: profile?.full_name ? `${profile.full_name} — Aza` : "Profile — Aza" };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Viewing your own profile via /u/ sends you to the full private view instead.
  if (user && user.id === id) redirect("/profile");

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("id, full_name, avatar_url")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const { data: extra } = await supabase
    .from("profiles")
    .select("job_title, exact_location, region")
    .eq("id", id)
    .maybeSingle();

  const [{ count: followerCount }, { count: followingCount }, { data: dbIdeas }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
    supabase
      .from("ideas")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  let isFollowing = false;
  if (user) {
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", id)
      .maybeSingle();
    isFollowing = !!existingFollow;
  }

  const ideas = (dbIdeas ?? []).map((i) =>
    mapDbIdeaToPrototype({ ...i, author_name: profile.full_name, author_avatar_url: profile.avatar_url })
  );

  return (
    <AppShell>
      <BackLink to="/" label="Back" />

      <div className="mb-6 flex items-start gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.full_name ?? "Profile"}
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-xl font-extrabold text-primary-strong">
            {(profile.full_name ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-display font-bold text-foreground">
            {profile.full_name ?? "Aza user"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {[extra?.job_title, extra?.exact_location || extra?.region].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-2 flex gap-4 text-sm">
            <span>
              <strong className="tabular">{followerCount ?? 0}</strong>{" "}
              <span className="text-muted-foreground">followers</span>
            </span>
            <span>
              <strong className="tabular">{followingCount ?? 0}</strong>{" "}
              <span className="text-muted-foreground">following</span>
            </span>
          </div>
        </div>
      </div>

      {user && <FollowButton targetId={id} initialIsFollowing={isFollowing} />}

      <h2 className="mb-3 mt-8 text-lg font-display font-bold text-foreground">Ideas</h2>
      {ideas.length === 0 ? (
        <Empty title="No ideas posted yet" />
      ) : (
        <div className="grid gap-3">
          {ideas.map((i) => (
            <IdeaCard key={i.id} idea={i} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
