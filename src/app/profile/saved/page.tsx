import type { Metadata } from "next";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { BackLink, Section } from "@/components/aza/kit";
import { OpportunityCard, PageHeader } from "@/components/aza/ui";
import { ideas as mockIdeas, opportunities as mockOpportunities } from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/server";
import { mapDbIdeaToPrototype, mapDbOpportunityToPrototype } from "@/lib/aza/mappers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved — Aza",
  description: "Opportunities and ideas you've saved.",
};

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let opps = mockOpportunities.slice(0, 3);
  let savedIdeas = mockIdeas.slice(1, 3);

  if (user) {
    const [{ data: dbSavedOpps }, { data: dbSavedIdeas }] = await Promise.all([
      supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id),
      supabase.from("saved_ideas").select("idea_id").eq("user_id", user.id),
    ]);

    if (dbSavedOpps && dbSavedOpps.length > 0) {
      const { data: realOpps } = await supabase
        .from("opportunities")
        .select("*")
        .in("id", dbSavedOpps.map((s) => s.opportunity_id));
      if (realOpps && realOpps.length > 0) {
        opps = realOpps.map((o) => mapDbOpportunityToPrototype(o));
      }
    }

    if (dbSavedIdeas && dbSavedIdeas.length > 0) {
      const { data: realIdeas } = await supabase
        .from("ideas")
        .select("*")
        .in("id", dbSavedIdeas.map((s) => s.idea_id));
      if (realIdeas && realIdeas.length > 0) {
        savedIdeas = realIdeas.map((i) => mapDbIdeaToPrototype(i));
      }
    }
  }

  return (
    <AppShell>
      <BackLink to="/profile" label="Profile" />
      <PageHeader title="Saved" />
      <Section title="Opportunities">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {opps.map((o) => (
            <OpportunityCard key={o.id} o={o} />
          ))}
        </div>
      </Section>
      <Section title="Ideas">
        <div className="grid gap-3 lg:grid-cols-2">
          {savedIdeas.map((i) => (
            <IdeaCard key={i.id} idea={i} />
          ))}
        </div>
      </Section>
    </AppShell>
  );
}
