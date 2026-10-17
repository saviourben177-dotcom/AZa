import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { BackLink, Empty, Section } from "@/components/aza/kit";
import { OpportunityCard, PageHeader } from "@/components/aza/ui";
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

  if (!user) redirect("/login?next=/profile/saved");

  const [{ data: dbSavedOpps }, { data: dbSavedIdeas }] = await Promise.all([
    supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id),
    supabase.from("saved_ideas").select("idea_id").eq("user_id", user.id),
  ]);

  let opps: ReturnType<typeof mapDbOpportunityToPrototype>[] = [];
  if (dbSavedOpps && dbSavedOpps.length > 0) {
    const { data: realOpps } = await supabase
      .from("opportunities")
      .select("*")
      .in("id", dbSavedOpps.map((s) => s.opportunity_id));
    opps = (realOpps ?? []).map((o) => mapDbOpportunityToPrototype(o, true));
  }

  let savedIdeas: ReturnType<typeof mapDbIdeaToPrototype>[] = [];
  if (dbSavedIdeas && dbSavedIdeas.length > 0) {
    const { data: realIdeas } = await supabase
      .from("ideas")
      .select("*, profiles(full_name, avatar_url)")
      .in("id", dbSavedIdeas.map((s) => s.idea_id));
    savedIdeas = (realIdeas ?? []).map((i) => mapDbIdeaToPrototype({ ...i, is_saved: true }));
  }

  return (
    <AppShell>
      <BackLink to="/profile" label="Profile" />
      <PageHeader title="Saved" />
      <Section title="Opportunities">
        {opps.length === 0 ? (
          <Empty title="No saved opportunities yet" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {opps.map((o) => (
              <OpportunityCard key={o.id} o={o} />
            ))}
          </div>
        )}
      </Section>
      <Section title="Ideas">
        {savedIdeas.length === 0 ? (
          <Empty title="No saved ideas yet" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {savedIdeas.map((i) => (
              <IdeaCard key={i.id} idea={i} currentUserId={user.id} />
            ))}
          </div>
        )}
      </Section>
    </AppShell>
  );
}
