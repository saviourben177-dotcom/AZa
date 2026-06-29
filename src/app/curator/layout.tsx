import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CuratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/curator");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "curator" && profile.role !== "admin")) {
    redirect("/profile");
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold text-ink">
          Curator dashboard
        </h1>
        <Link href="/profile" className="text-[12px] font-semibold text-ink/50">
          Exit
        </Link>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CuratorTab href="/curator" label="Opportunities" />
        <CuratorTab href="/curator/courses" label="Courses" />
        <CuratorTab href="/curator/tools" label="Business Tools" />
        <CuratorTab href="/curator/incubators" label="Incubators" />
        <CuratorTab href="/curator/businesses" label="Businesses" />
        <CuratorTab href="/curator/prices" label="Prices" />
      </div>

      {children}
    </div>
  );
}

function CuratorTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[12.5px] font-semibold text-ink/70"
    >
      {label}
    </Link>
  );
}
