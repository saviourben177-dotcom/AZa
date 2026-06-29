import { createClient } from "@/lib/supabase/server";
import IncubatorForm from "@/components/curator/incubator-form";
import DeleteIncubatorButton from "@/components/curator/delete-incubator-button";

export const dynamic = "force-dynamic";

export default async function CuratorIncubatorsPage() {
  const supabase = await createClient();
  const { data: incubators } = await supabase.from("incubators").select("*").order("deadline", { ascending: true, nullsFirst: false });

  return (
    <div>
      <h2 className="mb-3 font-display text-[16px] font-bold text-ink">Add an incubator</h2>
      <IncubatorForm />

      <h2 className="mb-2.5 mt-6 font-display text-[16px] font-bold text-ink">All incubators</h2>
      <div className="space-y-2">
        {(incubators ?? []).map((inc) => (
          <div key={inc.id} className="flex items-center justify-between rounded-card border border-line bg-surface px-3.5 py-2.5">
            <div>
              <p className="text-[13.5px] font-semibold text-ink">{inc.name}</p>
              <p className="text-[11px] text-ink/45">{inc.focus_area ?? "No focus area"}</p>
            </div>
            <DeleteIncubatorButton id={inc.id} />
          </div>
        ))}
        {(incubators ?? []).length === 0 && <p className="text-[13px] text-ink/50">No incubators yet.</p>}
      </div>
    </div>
  );
}
