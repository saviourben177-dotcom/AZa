import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Empty } from "@/components/aza/kit";
import { IdeaCard } from "@/components/aza/idea-card";
import { PageHeader } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";
import { mapDbIdeaToPrototype } from "@/lib/aza/mappers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My ideas — Aza Growth",
  description: "Ideas you have shared with the Aza community.",
};

export default async function MyIdeasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/growth/my-ideas");

  const { data: dbIdeas } = await supabase
    .from("ideas")
    .select("*, profiles(full_name, avatar_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (dbIdeas ?? []).map((i) => mapDbIdeaToPrototype(i));

  return (
    <AppShell>
      <BackLink to="/growth/ideas" label="Ideas" />
      <PageHeader
        title="My ideas"
        sub="Ideas you posted to the community"
        action={
          <Link
            href="/growth/ideas/new"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PenLine className="size-4" /> Share new idea
          </Link>
        }
      />
      {list.length === 0 ? (
        <Empty
          title="No ideas posted yet"
          sub="Share a problem you are solving, get feedback, and find collaborators."
          action={
            <Link
              href="/growth/ideas/new"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Post your first idea
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((i) => (
            <IdeaCard key={i.id} idea={i} currentUserId={user.id} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
