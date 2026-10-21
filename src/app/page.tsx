import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, GraduationCap, Briefcase, Code2, Trophy, Search } from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { Empty } from "@/components/aza/kit";
import { OpportunityCard, Deadline, Tag } from "@/components/aza/ui";
import GettingStartedCard from "@/components/aza/getting-started-card";
import AppGuideGate from "@/components/app-guide/app-guide-gate";
import { createClient } from "@/lib/supabase/server";
import { INTRO_COOKIE } from "@/lib/intro/cookie";
import { mapDbOpportunityToPrototype, mapDbIdeaToPrototype } from "@/lib/aza/mappers";

export const dynamic = "force-dynamic";

// Fixed four categories shown on the homepage. If your /discover page
// filters by different category values, update the `category` strings
// below to match exactly what /discover expects.
const CATEGORIES = [
  { label: "Scholarships", category: "scholarship", icon: GraduationCap },
  { label: "Internships", category: "internship", icon: Briefcase },
  { label: "Hackathons", category: "hackathon", icon: Code2 },
  { label: "Competitions", category: "competition", icon: Trophy },
];

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const cookieStore = await cookies();
    const hasSeenIntro = cookieStore.get(INTRO_COOKIE)?.value === "1";
    if (!hasSeenIntro) {
      redirect("/welcome");
    }
  }

  // Real gate: only a signed-in user whose own profile row says they
  // haven't seen the guide gets it. Guests (no profile row yet) never
  // see it here — it's shown after they actually have an account.
  let showAppGuide = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_seen_app_guide")
      .eq("id", user.id)
      .maybeSingle();
    showAppGuide = profile?.has_seen_app_guide === false;
  }

  const [{ data: dbOpps }, { data: dbIdeas }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*")
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("ideas")
      .select("*, public_profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // No mock fallback: an empty real result is a genuine "nothing here
  // yet" state, not a reason to show unrelated demo content as if it
  // were real.
  const oppList = (dbOpps ?? []).map((o) => mapDbOpportunityToPrototype(o));
  const closing = oppList.filter((o) => o.daysLeft !== null && o.daysLeft <= 10);
  const displayClosing = closing.length > 0 ? closing : oppList.slice(0, 6);

  const ideaList = (dbIdeas ?? []).map((i) => mapDbIdeaToPrototype(i));

  // Server-rendered, so this reflects the server's clock rather than the
  // visitor's — fine for a greeting, not used anywhere that needs to be exact.
  const hello = greeting(new Date().getHours());

  return (
    <AppShell>
      {showAppGuide && <AppGuideGate shouldShow />}
      <p className="text-sm font-bold text-primary-strong">{hello}</p>
      <h1 className="mt-1 text-2xl md:text-3xl font-display font-extrabold text-foreground">
        Find your next opportunity
      </h1>

      <Link
        href="/search"
        className="mt-5 mb-4 flex items-center gap-3 rounded-lg border border-input bg-card px-4 py-3.5 text-sm text-muted-foreground shadow-sm hover:border-primary/40"
      >
        <Search className="size-4 shrink-0" />
        Search scholarships, grants, fellowships...
      </Link>

      <GettingStartedCard />

      <div className="mt-7">
        <SectionHead title="Closing soon" to="/discover" />
        {displayClosing.length === 0 ? (
          <div className="mb-10">
            <Empty title="No opportunities yet" sub="Check back soon for new listings." />
          </div>
        ) : (
          <div className="-mx-4 mb-10 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0 lg:grid-cols-3">
            {displayClosing.map((o) => (
              <Link
                key={o.id}
                href={`/opportunities/${o.id}`}
                className={`card-lift relative flex w-[72%] shrink-0 snap-start flex-col gap-3 overflow-hidden rounded-lg border-t-4 bg-card p-4 pt-5 md:w-auto ${
                  o.daysLeft <= 7 ? "border-urgent" : "border-primary"
                }`}
              >
                <span className="emboss grid size-10 shrink-0 place-items-center rounded-md border font-display text-sm font-bold">
                  {o.orgMark}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">{o.category}</p>
                  <h3 className="mt-1 text-base leading-snug">{o.title}</h3>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1.5">
                  {o.amount && <Tag tone="primary">{o.amount}</Tag>}
                  <Deadline days={o.daysLeft} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mb-7">
        <h2 className="mb-3 text-lg font-display font-bold text-foreground">Browse by category</h2>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(({ label, category, icon: Icon }) => (
            <Link
              key={category}
              href={`/discover?category=${category}`}
              className="group flex flex-col items-center gap-2"
            >
              <span className="grid size-14 place-items-center rounded-2xl border bg-card text-primary transition-colors group-hover:bg-primary-soft">
                <Icon className="size-5" />
              </span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <SectionHead title="Latest opportunities" to="/discover" />
      {oppList.length === 0 ? (
        <div className="mb-10">
          <Empty title="No opportunities yet" sub="Check back soon for new listings." />
        </div>
      ) : (
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {oppList.slice(0, 6).map((o) => (
            <OpportunityCard key={o.id} o={o} />
          ))}
        </div>
      )}

      <SectionHead title="From the community" to="/growth" />
      {ideaList.length === 0 ? (
        <Empty title="No ideas posted yet" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {ideaList.slice(0, 2).map((i) => (
            <IdeaCard key={i.id} idea={i} currentUserId={user?.id} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function SectionHead({ title, to }: { title: string; to: "/discover" | "/growth" }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-display font-bold text-foreground">{title}</h2>
      <Link
        href={to}
        className="inline-flex h-11 items-center gap-1 rounded-md px-2 text-sm font-bold text-primary-strong hover:bg-primary-soft"
      >
        See all <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
