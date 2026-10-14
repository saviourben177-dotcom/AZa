"use client";

import { Search as SearchIcon } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { Empty, Section } from "@/components/aza/kit";
import { OpportunityCard, PageHeader } from "@/components/aza/ui";
import {
  ideas as mockIdeas,
  opportunities as mockOpportunities,
  type Opportunity,
  type Idea,
} from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/client";
import { mapDbOpportunityToPrototype, mapDbIdeaToPrototype } from "@/lib/aza/mappers";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [dbOpportunities, setDbOpportunities] = useState<Opportunity[]>([]);
  const [dbIdeas, setDbIdeas] = useState<Idea[]>([]);
  const [isPending, startTransition] = useTransition();

  const t = q.toLowerCase().trim();

  useEffect(() => {
    if (!t) {
      setDbOpportunities([]);
      setDbIdeas([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const supabase = createClient();
          const clean = t.replace(/[%,]/g, "");

          const [{ data: opps }, { data: ids }] = await Promise.all([
            supabase
              .from("opportunities")
              .select("*")
              .or(`title.ilike.%${clean}%,org.ilike.%${clean}%,category.ilike.%${clean}%`)
              .limit(10),
            supabase
              .from("ideas")
              .select("*")
              .or(`title.ilike.%${clean}%,description.ilike.%${clean}%`)
              .limit(10),
          ]);

          if (opps && opps.length > 0) {
            setDbOpportunities(opps.map((o) => mapDbOpportunityToPrototype(o)));
          } else {
            const filteredMock = mockOpportunities.filter((x) =>
              (x.title + x.org + x.category).toLowerCase().includes(t),
            );
            setDbOpportunities(filteredMock);
          }

          if (ids && ids.length > 0) {
            setDbIdeas(ids.map((item) => mapDbIdeaToPrototype(item)));
          } else {
            const filteredMock = mockIdeas.filter((x) =>
              (x.pitch + x.ask + x.stage).toLowerCase().includes(t),
            );
            setDbIdeas(filteredMock);
          }
        } catch {
          const filteredOpps = mockOpportunities.filter((x) =>
            (x.title + x.org + x.category).toLowerCase().includes(t),
          );
          const filteredIdeas = mockIdeas.filter((x) =>
            (x.pitch + x.ask + x.stage).toLowerCase().includes(t),
          );
          setDbOpportunities(filteredOpps);
          setDbIdeas(filteredIdeas);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [t]);

  const oppMatches = t ? dbOpportunities : [];
  const ideaMatches = t ? dbIdeas : [];
  const total = oppMatches.length + ideaMatches.length;

  return (
    <AppShell>
      <PageHeader
        title="Search"
        sub="Find grants, scholarships, co-founders and ideas across Aza."
      />

      <div className="relative mb-8 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by keyword, organisation, skill or topic..."
          aria-label="Search"
          autoFocus
          className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {isPending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            Searching...
          </span>
        )}
      </div>

      {!t ? (
        <Empty
          title="Start typing to search"
          sub="Search updates automatically across live opportunities and peer discussions."
        />
      ) : total === 0 && !isPending ? (
        <Empty
          title={`No matches for "${q}"`}
          sub="Try broader keywords or browse by category."
        />
      ) : (
        <div className="space-y-8">
          {oppMatches.length > 0 && (
            <Section title={`Opportunities (${oppMatches.length})`}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {oppMatches.map((o) => (
                  <OpportunityCard key={o.id} o={o} />
                ))}
              </div>
            </Section>
          )}

          {ideaMatches.length > 0 && (
            <Section title={`Ideas & conversations (${ideaMatches.length})`}>
              <div className="grid gap-3 lg:grid-cols-2">
                {ideaMatches.map((i) => (
                  <IdeaCard key={i.id} idea={i} />
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </AppShell>
  );
}
