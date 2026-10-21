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

  const { data: dbIdeas } = await supabase
    .from("ideas")
    .select("*, public_profiles(full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(50);

  const ideaIds = (dbIdeas ?? []).map((i) => i.id);
  let upvotedSet = new Set<string>();
  let savedSet = new Set<string>();
  if (user && ideaIds.length > 0) {
    const [{ data: upvotes }, { data: saves }] = await Promise.all([
      supabase.from("idea_upvotes").select("idea_id").eq("user_id", user.id).in("idea_id", ideaIds),
      supabase.from("saved_ideas").select("idea_id").eq("user_id", user.id).in("idea_id", ideaIds),
    ]);
    upvotedSet = new Set((upvotes ?? []).map((u) => u.idea_id));
    savedSet = new Set((saves ?? []).map((s) => s.idea_id));
  }

  const list = (dbIdeas ?? []).map((i) =>
    mapDbIdeaToPrototype({
      ...i,
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
