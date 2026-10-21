import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { AuthorLine, Tag } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";
import DeleteIdeaButton from "@/components/growth/delete-idea-button";

export const dynamic = "force-dynamic";

interface IdeaRole {
  id: string;
  role_name: string;
  slots_needed: number;
  slots_filled: number;
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the idea and its roles as two separate queries rather than one
  // nested join. A nested idea_roles(...) join is subject to idea_roles'
  // own RLS policy — if that policy is stricter than the one on ideas
  // itself (e.g. no owner exception), the whole combined query can come
  // back empty even when the parent idea row is genuinely visible, which
  // would incorrectly 404 the owner's own listing. Querying separately
  // means a roles-table permission quirk can't take down the whole page.
  const { data: idea } = await supabase
    .from("ideas")
    .select(
      "id, title, user_id, category, created_at, looking_for_collaborators, visibility, profiles(full_name, avatar_url)"
    )
    .eq("id", id)
    .maybeSingle();

  const isOwner = !!user && idea?.user_id === user.id;

  if (!idea) notFound();
  if (!isOwner && (!idea.looking_for_collaborators || idea.visibility !== "public")) notFound();

  const { data: rolesRaw } = await supabase
    .from("idea_roles")
    .select("id, role_name, slots_needed, slots_filled")
    .eq("idea_id", id);

  const roles = (rolesRaw as unknown as IdeaRole[]) ?? [];
  const authorProfile = idea.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
  const hoursAgo = Math.max(1, Math.round((Date.now() - new Date(idea.created_at).getTime()) / 3600000));

  return (
    <AppShell>
      <BackLink to="/businesses/team-finder" label="Team Finder" />
      <div className="max-w-2xl">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{idea.title}</h1>
          {isOwner && <DeleteIdeaButton ideaId={idea.id} redirectTo="/businesses/team-finder" />}
        </div>
        <div className="my-4">
          <AuthorLine
            id={idea.user_id}
            hoursAgo={hoursAgo}
            op
            name={authorProfile?.full_name ?? undefined}
            avatarUrl={authorProfile?.avatar_url}
            currentUserId={user?.id}
          />
        </div>
        {idea.category && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <Tag tone="primary">{idea.category}</Tag>
          </div>
        )}
        <h2 className="mb-2 text-lg font-display font-bold text-foreground">Open roles</h2>
        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No roles listed for this project.</p>
        ) : (
          <ul className="mb-6 divide-y rounded-lg border bg-card shadow-[var(--shadow-card)]">
            {roles.map((r) => {
              const isFull = r.slots_filled >= r.slots_needed;
              return (
                <li key={r.id} className="flex items-center justify-between p-4">
                  <div>
                    <span className="font-medium text-foreground">{r.role_name}</span>
                    <p className="text-xs text-muted-foreground">
                      {isFull ? "Full" : `${r.slots_needed - r.slots_filled} spot${r.slots_needed - r.slots_filled === 1 ? "" : "s"} open`}
                    </p>
                  </div>
                  {isFull ? (
                    <span className="text-sm text-muted-foreground">Full</span>
                  ) : (
                    <Link href={`/businesses/team-finder/${id}/join`} className={btn.primary}>
                      Apply
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
