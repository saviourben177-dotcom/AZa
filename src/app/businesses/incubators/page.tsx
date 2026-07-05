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
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/businesses" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Incubators & Accelerators</h1>
      </div>

      <div className="mt-5 space-y-3">
        {(incubators ?? []).length === 0 && (
          <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
            <p className="text-[13px] text-ink/55">No incubators listed yet — check back soon.</p>
          </div>
        )}
        {incubators?.map((inc) => (
          <div key={inc.id} className="rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[14px] font-bold text-ink">{inc.name}</p>
              {inc.curator_verified && <span className="shrink-0 rounded-pill bg-aza-light px-2.5 py-1 text-[10px] font-bold text-aza">✓ Verified</span>}
            </div>
            {inc.focus_area && <p className="mt-1 text-[11.5px] font-medium text-ink/50">{inc.focus_area}</p>}
            {inc.description && <p className="mt-2 text-[12.5px] leading-relaxed text-ink/65">{inc.description}</p>}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[11.5px] font-medium text-ink/45">{inc.remote ? "Remote" : inc.location ?? "Nigeria"}</span>
              {inc.application_url && (
                <a href={inc.application_url} target="_blank" rel="noopener noreferrer" className="rounded-pill bg-aza-light px-3 py-1.5 text-[12px] font-bold text-aza">
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
