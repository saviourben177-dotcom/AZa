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
  const { data: dbIdeas } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (dbIdeas ?? []).map((i) => mapDbIdeaToPrototype(i));

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
            <IdeaCard key={i.id} idea={i} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
