import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function IncubatorsPage() {
  const supabase = await createClient();
  const { data: incubators } = await supabase
    .from("incubators")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false });

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/businesses" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">Incubators & Accelerators</h1>
      </div>

      <div className="mt-4 space-y-3">
        {(incubators ?? []).length === 0 && (
          <div className="rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
            <p className="text-[13px] text-ink/60">No incubators listed yet — check back soon.</p>
          </div>
        )}
        {incubators?.map((inc) => (
          <div key={inc.id} className="rounded-card border border-line bg-surface p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13.5px] font-bold text-ink">{inc.name}</p>
              {inc.curator_verified && <span className="shrink-0 rounded-full bg-aza-light px-2 py-0.5 text-[10px] font-bold text-aza">✓ Verified</span>}
            </div>
            {inc.focus_area && <p className="mt-0.5 text-[11.5px] text-ink/50">{inc.focus_area}</p>}
            {inc.description && <p className="mt-1.5 text-[12.5px] text-ink/65">{inc.description}</p>}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-ink/45">{inc.remote ? "Remote" : inc.location ?? "Nigeria"}</span>
              {inc.application_url && (
                <a href={inc.application_url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-aza">
                  Apply →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
