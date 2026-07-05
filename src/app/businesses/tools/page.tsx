import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BusinessToolsPage() {
  const supabase = await createClient();
  const { data: tools } = await supabase.from("business_tools").select("*").order("created_at", { ascending: false });

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/businesses" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Business Tools</h1>
      </div>

      <div className="mt-5 space-y-3">
        {(tools ?? []).length === 0 && (
          <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
            <p className="text-[13px] text-ink/55">No tools added yet — check back soon.</p>
          </div>
        )}
        {tools?.map((tool) => (
          <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" className="block rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[14px] font-bold text-ink">{tool.title}</p>
              <span className="shrink-0 rounded-pill bg-paper-dim px-2.5 py-1 text-[10px] font-bold capitalize text-ink/55">{tool.tool_type}</span>
            </div>
            {tool.description && <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/60">{tool.description}</p>}
          </a>
        ))}
      </div>
    </div>
  );
}
