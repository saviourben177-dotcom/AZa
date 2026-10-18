"use client";

import Link from "next/link";
import { Search as SearchIcon, UserRound } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { Empty, Section } from "@/components/aza/kit";
import { OpportunityCard, PageHeader } from "@/components/aza/ui";
import type { Opportunity, Idea } from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/client";
import { mapDbOpportunityToPrototype, mapDbIdeaToPrototype } from "@/lib/aza/mappers";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState<string | undefined>();
  const [dbOpportunities, setDbOpportunities] = useState<Opportunity[]>([]);
  const [dbIdeas, setDbIdeas] = useState<Idea[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; full_name: string | null; avatar_url: string | null }[]>([]);
  const [searchFailed, setSearchFailed] = useState(false);
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
      setAccounts([]);
      setSearchFailed(false);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const supabase = createClient();
          // Keep PostgREST filter syntax out of user input.
          const clean = t.replace(/[(),.%_*\\]/g, " ").replace(/\s+/g, " ").trim();
          if (!clean) {
            setDbOpportunities([]);
            setDbIdeas([]);
            setAccounts([]);
            setSearchFailed(false);
            return;
          }

          const [{ data: opps, error: oppError }, { data: ids, error: ideaError }, { data: people, error: peopleError }] = await Promise.all([
            supabase
              .from("opportunities")
              .select("*")
              .or(`title.ilike.%${clean}%,org.ilike.%${clean}%,category.ilike.%${clean}%`)
              .limit(10),
            supabase
              .from("ideas")
              .select("*, profiles(full_name, avatar_url)")
              .or(`title.ilike.%${clean}%,description.ilike.%${clean}%`)
              .limit(10),
            // public_profiles deliberately exposes only public display fields.
            supabase
              .from("public_profiles")
              .select("id, full_name, avatar_url")
              .ilike("full_name", `%${clean}%`)
              .limit(10),
          ]);

          if (oppError || ideaError || peopleError) throw new Error("Search query failed");
          // Zero rows is a real result, not a reason to show unrelated demo content.
          setDbOpportunities((opps ?? []).map((o) => mapDbOpportunityToPrototype(o)));
          setDbIdeas((ids ?? []).map((item) => mapDbIdeaToPrototype(item)));
          setAccounts((people ?? []).filter((person) => person.id !== userId));
          setSearchFailed(false);
        } catch {
          setDbOpportunities([]);
          setDbIdeas([]);
          setAccounts([]);
          setSearchFailed(true);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [t]);

  const oppMatches = t ? dbOpportunities : [];
  const ideaMatches = t ? dbIdeas : [];
  const accountMatches = t ? accounts : [];
  const total = oppMatches.length + ideaMatches.length + accountMatches.length;

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

      {searchFailed && t ? (
        <Empty title="Search is temporarily unavailable" sub="Please check your connection and try again." />
      ) : !t ? (
        <Empty
          title="Start typing to search"
          sub="Search live opportunities, community ideas, and discoverable accounts."
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

          {accountMatches.length > 0 && (
            <Section title={`People (${accountMatches.length})`}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {accountMatches.map((person) => (
                  <Link
                    key={person.id}
                    href={`/u/${person.id}`}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-accent"
                  >
                    {person.avatar_url ? (
                      // Public avatar URL comes from the safe public_profiles view.
                      <img src={person.avatar_url} alt="" className="size-11 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-strong"><UserRound className="size-5" /></span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{person.full_name || "Aza member"}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">View profile</span>
                    </span>
                  </Link>
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
