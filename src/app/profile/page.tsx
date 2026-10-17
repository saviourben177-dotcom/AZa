import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, FileText, Lightbulb, PenLine, Settings } from "lucide-react";
import { Tile, Empty } from "@/components/aza/kit";
import { AppShell } from "@/components/aza/app-shell";
import { IdeaCard } from "@/components/aza/idea-card";
import { Avatar, OpportunityCard } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";
import { mapDbIdeaToPrototype, mapDbOpportunityToPrototype } from "@/lib/aza/mappers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your profile — Aza",
  description: "Your ideas, saved opportunities and CV on Aza.",
};

function cvCompletionPercent(cv: {
  summary: string | null;
  skills: string[] | null;
  education: unknown;
  experience: unknown;
} | null): number {
  if (!cv) return 0;
  const sections = [
    !!cv.summary?.trim(),
    (cv.skills?.length ?? 0) > 0,
    Array.isArray(cv.education) && cv.education.length > 0,
    Array.isArray(cv.experience) && cv.experience.length > 0,
  ];
  const filled = sections.filter(Boolean).length;
  return Math.round((filled / sections.length) * 100);
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile");

  const [{ data: p }, { data: dbIdeas }, { data: dbSaved }, { data: dbApps }, { data: cv }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("ideas")
        .select("*, profiles(full_name, avatar_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id),
      supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id).eq("status", "applied"),
      supabase.from("cv_profiles").select("summary, skills, education, experience").eq("user_id", user.id).maybeSingle(),
    ]);

  const profileData = {
    id: user.id,
    name: p?.full_name || user.email?.split("@")[0] || "User",
    role: p?.job_title || "Founder & Builder",
    location: p?.exact_location || p?.region || "Nigeria",
    avatarUrl: p?.avatar_url ?? null,
  };

  const myIdeas = (dbIdeas ?? []).map((i) => mapDbIdeaToPrototype(i));
  const ideasCount = myIdeas.length;
  const savedCount = dbSaved?.length ?? 0;
  const appliedCount = dbApps?.length ?? 0;
  const cvPercent = cvCompletionPercent(cv);

  let savedOpportunities: ReturnType<typeof mapDbOpportunityToPrototype>[] = [];
  if (dbSaved && dbSaved.length > 0) {
    const oppIds = dbSaved.map((s) => s.opportunity_id);
    const { data: dbOpps } = await supabase
      .from("opportunities")
      .select("*")
      .in("id", oppIds)
      .limit(3);
    savedOpportunities = (dbOpps ?? []).map((o) => mapDbOpportunityToPrototype(o));
  }

  return (
    <AppShell>
      <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar id={profileData.id} size={64} />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-display font-bold text-foreground">
              {profileData.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profileData.role} · {profileData.location}
            </p>
          </div>
        </div>
        <Link
          href="/profile/settings"
          aria-label="Settings"
          className="grid size-11 place-items-center rounded-md border border-input bg-background hover:bg-accent text-foreground transition-colors"
        >
          <Settings className="size-4" />
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-3 divide-x rounded-lg border bg-card text-center shadow-[var(--shadow-card)]">
        {[
          ["Ideas", ideasCount],
          ["Saved", savedCount],
          ["Applied", appliedCount],
        ].map(([l, n]) => (
          <div key={l as string} className="p-4">
            <p className="tabular font-display text-2xl font-extrabold text-foreground">{n}</p>
            <p className="text-sm text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile to="/profile/edit" icon={PenLine} title="Edit profile" sub="Name, role, bio" />
        <Tile to="/profile/cv" icon={FileText} title="CV" sub="View and tailor" />
        <Tile to="/profile/saved" icon={Bookmark} title="Saved" sub="Opportunities, ideas" />
        <Tile to="/growth/my-ideas" icon={Lightbulb} title="My ideas" sub="Manage posts" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-display font-bold text-foreground">
            <Bookmark className="size-4 text-primary" /> Saved
          </h2>
          {savedOpportunities.length === 0 ? (
            <Empty title="No saved opportunities yet" sub="Bookmark one from Discover to see it here." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {savedOpportunities.map((o) => (
                <OpportunityCard key={o.id} o={o} />
              ))}
            </div>
          )}

          <h2 className="mb-3 mt-8 text-lg font-display font-bold text-foreground">Your ideas</h2>
          <div className="grid gap-3">
            {myIdeas.length > 0 ? (
              myIdeas.map((i) => <IdeaCard key={i.id} idea={i} currentUserId={user.id} />)
            ) : (
              <p className="text-sm text-muted-foreground">No ideas posted yet.</p>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
          <FileText className="size-5 text-primary" />
          <h2 className="mt-3 text-base font-display font-bold text-foreground">
            Your CV is {cvPercent}% complete
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {cvPercent < 100
              ? "Add education and experience to tailor applications automatically."
              : "Your CV is ready to tailor applications automatically."}
          </p>
          <div className="mt-4 h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${cvPercent}%` }} />
          </div>
          <Link
            href="/profile/cv"
            className="mt-4 inline-flex h-11 items-center text-sm font-bold text-primary-strong hover:underline"
          >
            {cvPercent < 100 ? "Finish CV →" : "View CV →"}
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}
