import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { Empty } from "@/components/aza/kit";
import { OpportunityCard } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";
import { INTRO_COOKIE } from "@/lib/intro/cookie";
import { mapDbOpportunityToPrototype, mapDbIdeaToPrototype } from "@/lib/aza/mappers";

export const dynamic = "force-dynamic";

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

  const [{ data: dbOpps }, { data: dbIdeas }] = await Promise.all([
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
  ]);

  // No mock fallback: an empty real result is a genuine "nothing here
  // yet" state, not a reason to show unrelated demo content as if it
  // were real.
  const oppList = (dbOpps ?? []).map((o) => mapDbOpportunityToPrototype(o));
  const closing = oppList.filter((o) => o.daysLeft !== null && o.daysLeft <= 10);
  const displayClosing = closing.length > 0 ? closing : oppList.slice(0, 6);

  const ideaList = (dbIdeas ?? []).map((i) => mapDbIdeaToPrototype(i));

  return (
    <AppShell>
      <section className="mb-8 rounded-lg border border-primary/20 bg-primary-soft p-5 shadow-[var(--shadow-card)] md:p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-primary-strong">This week</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-display font-extrabold text-foreground">
          {displayClosing.length} opportunities close in the next 10 days
        </h1>
      </section>

      <SectionHead title="Closing soon" to="/discover" />
      {displayClosing.length === 0 ? (
        <div className="mb-10">
          <Empty title="No opportunities yet" sub="Check back soon for new listings." />
        </div>
      ) : (
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayClosing.map((o) => (
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
