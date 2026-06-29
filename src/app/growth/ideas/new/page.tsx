import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewIdeaForm from "@/components/growth/new-idea-form";

export default async function NewIdeaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/growth/ideas/new");

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/growth/ideas" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">Add Idea</h1>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aza-light">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-3 font-display text-[16px] font-bold text-ink">Got an idea?</p>
        <p className="text-[12.5px] text-ink/55">Share it with the community.</p>
      </div>

      <NewIdeaForm />
    </div>
  );
}
