import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Empty } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import JoinRequestForm from "./join-request-form";

export const dynamic = "force-dynamic";

export default async function RequestToJoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/businesses/team-finder/${id}/join`);

  const { data: idea, error } = await supabase
    .from("ideas")
    .select("id, title, user_id, idea_roles(*)")
    .eq("id", id)
    .single();

  if (error || !idea) notFound();

  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", idea.user_id)
    .single();

  const roles = (idea.idea_roles ?? []) as {
    id: string;
    role_name: string;
    slots_needed: number;
    slots_filled: number;
  }[];

  return (
    <AppShell>
      <BackLink to={`/businesses/team-finder/${id}`} label={idea.title} />
      <PageHeader title="Request to Join" sub={`${idea.title} · by ${owner?.full_name ?? "Aza user"}`} />

      {roles.length === 0 ? (
        <Empty title="No open roles right now" />
      ) : (
        <JoinRequestForm ideaId={id} roles={roles} />
      )}
    </AppShell>
  );
}
