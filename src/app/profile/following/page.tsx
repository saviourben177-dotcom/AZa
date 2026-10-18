import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Empty } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Following — Aza",
};

export default async function FollowingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile/following");

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const ids = (follows ?? []).map((f) => f.following_id);
  const { data: profiles } =
    ids.length > 0
      ? await supabase.from("public_profiles").select("id, full_name, avatar_url").in("id", ids)
      : { data: [] };

  return (
    <AppShell>
      <BackLink to="/profile" label="Profile" />
      <PageHeader title="Following" sub="Only you can see this list." />
      {(profiles ?? []).length === 0 ? (
        <Empty title="You're not following anyone yet" sub="Follow people from their profile." />
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {(profiles ?? []).map((p) => (
            <li key={p.id}>
              <Link href={`/u/${p.id}`} className="flex items-center gap-3 p-4 hover:bg-accent">
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.avatar_url}
                    alt={p.full_name ?? "Profile"}
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-strong">
                    {(p.full_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate font-medium text-foreground">
                  {p.full_name ?? "Aza user"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
