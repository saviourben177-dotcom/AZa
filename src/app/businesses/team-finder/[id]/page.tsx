import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IDEA_STAGE_LABELS } from "@/lib/types";
import DetailAccordion from "@/components/team-finder/detail-accordion";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ requested?: string }>;
}) {
  const { id } = await params;
  const { requested } = await searchParams;
  const supabase = await createClient();

  const { data: idea, error } = await supabase
    .from("ideas")
    .select("*, idea_roles(*)")
    .eq("id", id)
    .single();

  if (error || !idea) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: owner } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", idea.user_id)
    .single();

  const { data: acceptedRequests } = await supabase
    .from("join_requests")
    .select("id, requester_id, role_id, profiles!join_requests_requester_id_fkey(full_name, avatar_url)")
    .eq("idea_id", id)
    .eq("status", "accepted");

  const roles = (idea.idea_roles ?? []) as {
    id: string;
    role_name: string;
    slots_needed: number;
    slots_filled: number;
  }[];

  const isOwner = user?.id === idea.user_id;
  const totalSlots = roles.reduce((sum, r) => sum + r.slots_needed, 0) + 1; // +1 for owner
  const filledSlots = roles.reduce((sum, r) => sum + r.slots_filled, 0) + 1;

  let myRequestStatus: string | null = null;
  if (user && !isOwner) {
    const { data: mine } = await supabase
      .from("join_requests")
      .select("status")
      .eq("idea_id", id)
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .maybeSingle();
    myRequestStatus = mine?.status ?? null;
  }

  return (
    <div className="pb-8">
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-aza-dark via-aza to-emerald-400">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(255_255_255/0.18),transparent_45%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 shadow-elevated backdrop-blur-sm">
            <span className="text-[32px] font-semibold text-white">
              {idea.title.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <Link
            href="/businesses/team-finder"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <div className="flex gap-2">
            <button aria-label="Save" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 3h12v18l-6-4-6 4V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            </button>
            <button aria-label="Share" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 15V3m0 0L7 8m5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="px-5">
        {requested === "1" && (
          <div className="mt-4 flex items-center gap-2.5 rounded-card-sm border border-aza/30 bg-aza-light px-4 py-3 shadow-card">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0 text-aza"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p className="text-[12.5px] font-semibold text-aza-dark">Request sent — the project owner will review it soon.</p>
          </div>
        )}

        <h1 className="mt-5 text-[21px] font-semibold leading-tight text-ink">{idea.title}</h1>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-aza-light text-[10px] font-semibold text-aza">
            {(owner?.full_name ?? "?").charAt(0).toUpperCase()}
          </div>
          <p className="text-[12.5px] text-text-secondary">
            by <span className="font-semibold text-ink/75">{owner?.full_name ?? "Aza user"}</span>
          </p>
          {isOwner && (
            <span className="rounded-pill bg-ink px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-paper">
              Founder
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <span className="rounded-pill bg-paper-dim px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            {IDEA_STAGE_LABELS[idea.stage as keyof typeof IDEA_STAGE_LABELS]}
          </span>
          {idea.category && (
            <span className="rounded-pill bg-paper-dim px-3 py-1.5 text-[11px] font-semibold text-text-secondary">
              {idea.category}
            </span>
          )}
        </div>

        <section className="mt-5">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-text-tertiary">About</p>
          <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink/70">
            {idea.description}
          </p>
        </section>

        {roles.length > 0 && (
          <section className="mt-5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-text-tertiary">Skills needed</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {roles.map((r) => {
                const full = r.slots_filled >= r.slots_needed;
                return (
                  <span
                    key={r.id}
                    className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold ${
                      full ? "bg-paper-dim text-text-tertiary line-through" : "bg-aza-light text-aza"
                    }`}
                  >
                    {r.role_name} ({r.slots_needed - r.slots_filled > 0 ? r.slots_needed - r.slots_filled : 0})
                  </span>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-card bg-surface shadow-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">Current Team</p>
            <p className="text-[12.5px] font-semibold text-text-tertiary tabular">
              {filledSlots} / {totalSlots}
            </p>
          </div>
          <div className="mt-3.5 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TeamMember name={owner?.full_name ?? "Owner"} avatarUrl={owner?.avatar_url} role="Founder" />
            {(acceptedRequests ?? []).map((r) => {
              const profile = r.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
              const roleName = roles.find((role) => role.id === r.role_id)?.role_name ?? "Collaborator";
              return (
                <TeamMember
                  key={r.id}
                  name={profile?.full_name ?? "Member"}
                  avatarUrl={profile?.avatar_url}
                  role={roleName}
                />
              );
            })}
            {roles
              .flatMap((r) =>
                Array.from({ length: Math.max(0, r.slots_needed - r.slots_filled) }).map((_, i) => (
                  <OpenSlot key={`${r.id}-${i}`} role={r.role_name} />
                ))
              )
              .slice(0, 3)}
          </div>
        </section>

        <section className="mt-2 rounded-card bg-surface shadow-card px-4 shadow-card">
          <DetailAccordion label="Timeline" value="Q3 2025">
            No fixed deadline yet — the team is aiming to have a working version ready within the next few months.
          </DetailAccordion>
          <DetailAccordion label="Requirements">
            Be responsive, comfortable working async, and genuinely interested in the problem this project solves. No prior team experience required.
          </DetailAccordion>
          <DetailAccordion label="Project Discussion" value={0}>
            Discussion threads open once you join the team.
          </DetailAccordion>
        </section>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-line bg-paper/95 px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3.5 shadow-elevated backdrop-blur-xl">
        <div className="flex gap-2.5">
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-card bg-surface shadow-card py-3 text-[13.5px] font-semibold text-ink shadow-card">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 3h12v18l-6-4-6 4V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            Save
          </button>
          {isOwner ? (
            <Link
              href="/businesses/team-finder/requests"
              className="flex flex-[1.3] items-center justify-center rounded-card bg-aza py-3 text-[13.5px] font-semibold text-white shadow-glow-accent"
            >
              View Requests
            </Link>
          ) : myRequestStatus ? (
            <span className="flex flex-[1.3] items-center justify-center rounded-card bg-paper-dim py-3 text-[13.5px] font-semibold capitalize text-text-secondary">
              Request {myRequestStatus}
            </span>
          ) : (
            <Link
              href={`/businesses/team-finder/${id}/join`}
              className="flex flex-[1.3] items-center justify-center rounded-card bg-aza py-3 text-[13.5px] font-semibold text-white shadow-glow-accent"
            >
              I&apos;m Interested
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamMember({ name, avatarUrl, role }: { name: string; avatarUrl?: string | null; role: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-aza/25" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aza-light text-[14px] font-semibold text-aza ring-2 ring-aza/15">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <p className="max-w-[64px] truncate text-[11px] font-semibold text-ink">{name.split(" ")[0]}</p>
      <p className="max-w-[64px] truncate text-[10px] font-medium text-text-tertiary">{role}</p>
    </div>
  );
}

function OpenSlot({ role }: { role: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-line-strong text-ink/30">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </div>
      <p className="max-w-[64px] truncate text-[10px] font-semibold text-text-tertiary">{role}</p>
    </div>
  );
}
