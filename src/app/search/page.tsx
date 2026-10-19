"use client";

import { Search as SearchIcon } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { Empty, Section } from "@/components/aza/kit";
import { OpportunityCard, PageHeader } from "@/components/aza/ui";
import type { Opportunity, Idea } from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/client";
import { mapDbOpportunityToPrototype, mapDbIdeaToPrototype } from "@/lib/aza/mappers";

// Real values of the `category` column (see src/app/welcome/welcome-card.tsx
// and src/lib/aza/mappers.ts for confirmed usage). `category` is a Postgres
// enum, and ilike against an enum column inside an `.or()` filter string is
// rejected by PostgREST — that silently failed the whole opportunities
// query, which is why searching "internship", "hackathon" etc. above
// returned zero results. Matched separately below via `.eq()` instead.
const CATEGORY_VALUES = ["scholarship", "internship", "hackathon", "competition", "grant", "fellowship"];

function matchedCategory(term: string): string | null {
  return CATEGORY_VALUES.find((c) => c === term || `${c}s` === term) ?? null;
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState<string | undefined>();
  const [dbOpportunities, setDbOpportunities] = useState<Opportunity[]>([]);
  const [dbIdeas, setDbIdeas] = useState<Idea[]>([]);
  const [isPending, startTransition] = useTransition();

  const t = q.toLowerCase().trim();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

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
          const category = matchedCategory(t);

          const [{ data: opps }, { data: ids }] = await Promise.all([
            supabase
              .from("opportunities")
              .select("*")
              .or(`title.ilike.%${clean}%,org.ilike.%${clean}%,location.ilike.%${clean}%`)
              .limit(10),
            supabase
              .from("ideas")
              .select("*, profiles(full_name, avatar_url)")
              .or(`title.ilike.%${clean}%,description.ilike.%${clean}%`)
              .limit(10),
          ]);

          let oppRows = opps ?? [];
          if (category) {
            const { data: categoryOpps } = await supabase
              .from("opportunities")
              .select("*")
              .eq("category", category)
              .limit(10);
            const seen = new Set(oppRows.map((o) => o.id));
            for (const row of categoryOpps ?? []) {
              if (!seen.has(row.id)) {
                oppRows = [...oppRows, row];
                seen.add(row.id);
              }
            }
          }

          // Zero rows is a real, correct result — it means nothing matched,
          // not a reason to show unrelated demo content instead.
          setDbOpportunities(oppRows.map((o) => mapDbOpportunityToPrototype(o)));
          setDbIdeas((ids ?? []).map((item) => mapDbIdeaToPrototype(item)));
        } catch {
          setDbOpportunities([]);
          setDbIdeas([]);
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
                  <IdeaCard key={i.id} idea={i} currentUserId={userId} />
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </AppShell>
  );
}
