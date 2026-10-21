import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { Empty } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";
import { mapDbIdeaToPrototype } from "@/lib/aza/mappers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ideas feed — Aza Growth",
  description:
    "Founders share what they're building and what they need: co-founders, feedback, testers.",
};

export default async function IdeasFeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // public_profiles is a view with no declared foreign key back to
  // ideas.user_id, so PostgREST can't resolve it as an embed — embedding
  // it (public_profiles(...)) fails the whole query. Fetch ideas and
  // author profiles as separate queries and join them in JS instead.
  const { data: dbIdeas } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const ideaIds = (dbIdeas ?? []).map((i) => i.id);
  const authorIds = Array.from(new Set((dbIdeas ?? []).map((i) => i.user_id).filter(Boolean)));

  const [profilesResult, upvotesResult, savesResult] = await Promise.all([
    authorIds.length > 0
      ? supabase.from("public_profiles").select("id, full_name, avatar_url").in("id", authorIds)
      : Promise.resolve({ data: null }),
    user && ideaIds.length > 0
      ? supabase.from("idea_upvotes").select("idea_id").eq("user_id", user.id).in("idea_id", ideaIds)
      : Promise.resolve({ data: null }),
    user && ideaIds.length > 0
      ? supabase.from("saved_ideas").select("idea_id").eq("user_id", user.id).in("idea_id", ideaIds)
      : Promise.resolve({ data: null }),
  ]);

  const profileMap = new Map(
    (profilesResult.data ?? []).map((p: any) => [p.id as string, { full_name: p.full_name, avatar_url: p.avatar_url }])
  );
  const upvotedSet = new Set((upvotesResult.data ?? []).map((u: any) => u.idea_id));
  const savedSet = new Set((savesResult.data ?? []).map((s: any) => s.idea_id));

  const list = (dbIdeas ?? []).map((i) =>
    mapDbIdeaToPrototype({
      ...i,
      public_profiles: profileMap.get(i.user_id),
      is_upvoted: upvotedSet.has(i.id),
      is_saved: savedSet.has(i.id),
    })
  );

  return (
    <AppShell>
      <PageHeader
        title="Ideas"
        sub="What people are building, and what they need from you"
        action={
          <Link
            href="/growth/ideas/new"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PenLine className="size-4" />{" "}
            <span className="hidden sm:inline">Share an idea</span>
          </Link>
        }
      />
      {list.length === 0 ? (
        <Empty
          title="No ideas posted yet"
          sub="Be the first to share what you're building."
          action={
            <Link
              href="/growth/ideas/new"
              className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Share an idea
            </Link>
          }
        />
      ) : (
        <div className="mx-auto grid max-w-5xl gap-3 lg:grid-cols-2">
          {list.map((i) => (
            <IdeaCard key={i.id} idea={i} currentUserId={user?.id} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
