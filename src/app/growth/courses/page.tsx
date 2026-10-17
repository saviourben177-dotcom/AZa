import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import SaveResourceButton from "@/components/save-resource-button";
import CategoryPills from "./category-pills";

export const dynamic = "force-dynamic";

function categoryLabel(c: string): string {
  return c.replace("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: resources } = await supabase
    .from("skill_resources")
    .select("*, skills(name, category)")
    .order("created_at", { ascending: false })
    .limit(50);

  const filtered = category
    ? (resources ?? []).filter((r) => (r.skills as unknown as { category: string })?.category === category)
    : resources ?? [];

  const { data: skillRows } = await supabase.from("skills").select("category");
  const categories = Array.from(new Set((skillRows ?? []).map((s) => s.category))).sort();

  let savedIds = new Set<string>();
  if (user) {
    const { data: savedResources } = await supabase
      .from("saved_resources")
      .select("resource_id")
      .eq("user_id", user.id);
    savedIds = new Set((savedResources ?? []).map((s) => s.resource_id));
  }

  return (
    <AppShell>
      <BackLink to="/growth" label="Growth" />
      <PageHeader title="Courses" sub="Picked for young founders" />

      <CategoryPills categories={categories} active={category ?? null} labelFn={categoryLabel} />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses yet in this category.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-lift flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">
                  {(r.skills as unknown as { name: string })?.name}
                  {r.curator_verified ? " · Verified" : ""}
                </p>
                <SaveResourceButton resourceId={r.id} initialSaved={savedIds.has(r.id)} isAuthed={!!user} />
              </div>
              <h3 className="text-base font-display font-bold leading-snug text-foreground">{r.title}</h3>
              <p className="text-sm text-muted-foreground">{r.provider ?? "Unknown provider"}</p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {r.is_free ? <Tag tone="primary">Free</Tag> : <Tag>Paid</Tag>}
                <Tag>{r.level}</Tag>
                {r.duration_hours ? <Tag icon={<Clock className="size-3.5" />}>{r.duration_hours}h</Tag> : null}
                {r.rating ? <Tag>★{r.rating}</Tag> : null}
              </div>
            </a>
          ))}
        </div>
      )}
    </AppShell>
  );
}
