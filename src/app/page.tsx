import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  HandCoins,
  Laptop,
  Lightbulb,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import AppGuideGate from "@/components/app-guide/app-guide-gate";
import { IdeaCard } from "@/components/aza/idea-card";
import { Empty } from "@/components/aza/kit";
import { OpportunityCard } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";
import { INTRO_COOKIE } from "@/lib/intro/cookie";
import { mapDbOpportunityToPrototype, mapDbIdeaToPrototype } from "@/lib/aza/mappers";

export const dynamic = "force-dynamic";

const categories = [
  { label: "Scholarships", icon: GraduationCap, query: "scholarship" },
  { label: "Grants", icon: HandCoins, query: "grant" },
  { label: "Jobs", icon: BriefcaseBusiness, query: "job" },
  { label: "Internships", icon: Laptop, query: "internship" },
  { label: "Hackathons", icon: Trophy, query: "hackathon" },
  { label: "Ideas", icon: Lightbulb, href: "/growth" },
];

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const cookieStore = await cookies();
    const hasSeenIntro = cookieStore.get(INTRO_COOKIE)?.value === "1";
    if (!hasSeenIntro) redirect("/welcome");
  }

  const [{ data: dbOpps }, { data: dbIdeas }, { data: profile }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*")
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("ideas")
      .select("*, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("profiles")
      .select("has_seen_app_guide")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
  ]);

  const oppList = (dbOpps ?? []).map((o) => mapDbOpportunityToPrototype(o));
  const closing = oppList.filter((o) => o.daysLeft !== null && o.daysLeft <= 10);
  const displayClosing = (closing.length > 0 ? closing : oppList).slice(0, 8);
  const ideaList = (dbIdeas ?? []).map((i) => mapDbIdeaToPrototype(i));

  return (
    <AppShell>
      {user && <AppGuideGate shouldShow={!profile?.has_seen_app_guide} />}
      <div className="mx-auto w-full max-w-5xl">
        <section className="mb-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-strong">Your next step starts here</p>
              <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
                Find your next <span className="text-primary-strong">opportunity.</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Scholarships, grants, jobs and ideas worth your time — all in one place.
              </p>
            </div>
            <span aria-hidden className="mt-1 grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-strong">
              <Sparkles className="size-5" />
            </span>
          </div>

          <Link
            href="/search"
            className="mt-5 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 text-sm text-muted-foreground shadow-sm transition hover:border-primary/40 hover:bg-accent"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1">Search opportunities, skills, ideas...</span>
            <span className="rounded-lg bg-muted px-2 py-1 text-[11px] font-semibold">Search</span>
          </Link>
        </section>

        <section className="mb-8" aria-labelledby="categories-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="categories-heading" className="text-base font-bold tracking-tight">Explore by category</h2>
            <Link href="/discover" className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-bold text-primary-strong">
              All opportunities <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {categories.map((category) => {
              const Icon = category.icon;
              const href = "href" in category && category.href
                ? category.href
                : `/discover?category=${encodeURIComponent("query" in category ? category.query : "")}`;
              return (
                <Link
                  key={category.label}
                  href={href}
                  className="group flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-2 py-3.5 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-strong transition group-hover:bg-background">
                    <Icon className="size-[19px]" strokeWidth={1.9} />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-foreground sm:text-xs">{category.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-8" aria-labelledby="closing-heading">
          <SectionHead title="Closing soon" to="/discover" id="closing-heading" />
          {displayClosing.length === 0 ? (
            <Empty title="No opportunities yet" sub="Check back soon for new listings." />
          ) : (
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {displayClosing.map((o) => (
                <div key={o.id} className="w-[min(82vw,300px)] shrink-0 snap-start sm:w-auto">
                  <OpportunityCard o={o} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8" aria-labelledby="latest-heading">
          <SectionHead title="Latest opportunities" to="/discover" id="latest-heading" />
          {oppList.length === 0 ? (
            <Empty title="Nothing new just yet" sub="New opportunities will appear here when they are added." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {oppList.slice(0, 6).map((o) => (
                <OpportunityCard key={o.id} o={o} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="community-heading">
          <SectionHead title="From the community" to="/growth" id="community-heading" />
          {ideaList.length === 0 ? (
            <Empty title="No ideas posted yet" sub="Community ideas will show up here." />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {ideaList.slice(0, 2).map((i) => (
                <IdeaCard key={i.id} idea={i} currentUserId={user?.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SectionHead({
  title,
  to,
  id,
}: {
  title: string;
  to: "/discover" | "/growth";
  id: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="text-base font-bold tracking-tight text-foreground sm:text-lg">{title}</h2>
      <Link
        href={to}
        className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-primary-strong transition hover:bg-primary-soft sm:text-sm"
      >
        See all <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
