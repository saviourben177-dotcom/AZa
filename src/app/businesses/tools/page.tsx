import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BusinessToolsPage() {
  const supabase = await createClient();
  const { data: tools } = await supabase.from("business_tools").select("*").order("created_at", { ascending: false });

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/businesses" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">Business Tools</h1>
      </div>

      <div className="mt-4 space-y-2.5">
        {(tools ?? []).length === 0 && (
          <div className="rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
            <p className="text-[13px] text-ink/60">No tools added yet — check back soon.</p>
          </div>
        )}
        {tools?.map((tool) => (
          <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" className="block rounded-card border border-line bg-surface p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[13.5px] font-bold text-ink">{tool.title}</p>
              <span className="rounded-full bg-paper-dim px-2 py-0.5 text-[10px] font-semibold capitalize text-ink/55">{tool.tool_type}</span>
            </div>
            {tool.description && <p className="mt-1 text-[12px] text-ink/60">{tool.description}</p>}
          </a>
        ))}
      </div>
    </div>
  );
}
