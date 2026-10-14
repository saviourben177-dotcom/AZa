import type { Metadata } from "next";
import { BookOpen, Lightbulb, MessageSquareText, PenLine, Sprout } from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { Progress, Section, Tile } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { ideas as mockIdeas, skills } from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/server";
import { mapDbIdeaToPrototype } from "@/lib/aza/mappers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Growth — Aza",
  description: "Track skills, find free courses and share ideas with young founders.",
};

export default async function GrowthHubPage() {
  const supabase = await createClient();
  const { data: dbIdeas } = await supabase
    .from("ideas")
    .select("*")
    .order("upvotes_count", { ascending: false })
    .limit(4);

  const displayedIdeas =
    dbIdeas && dbIdeas.length > 0
      ? dbIdeas.map((i) => mapDbIdeaToPrototype(i))
      : mockIdeas.slice(0, 3);

  return (
    <AppShell>
      <PageHeader title="Growth" sub="Learn, build and get feedback" />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile to="/growth/ideas" icon={Lightbulb} title="Ideas" sub="Community feed" />
        <Tile to="/growth/ideas/new" icon={PenLine} title="Share" sub="Post an idea" />
        <Tile to="/growth/skills" icon={Sprout} title="Skills" sub="Your progress" />
        <Tile to="/growth/courses" icon={BookOpen} title="Courses" sub="Free and paid" />
        <Tile to="/growth/assistant" icon={MessageSquareText} title="Assistant" sub="Ask anything" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Section title="Trending ideas">
          <div className="grid gap-3">
            {displayedIdeas.map((i) => (
              <IdeaCard key={i.id} idea={i} />
            ))}
          </div>
        </Section>
        <Section title="Your skills">
          <div className="space-y-4 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
            {skills.map((s) => (
              <div key={s.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold text-foreground">{s.name}</span>
                  <span className="tabular font-bold text-primary-strong">{s.progress}%</span>
                </div>
                <Progress value={s.progress} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
