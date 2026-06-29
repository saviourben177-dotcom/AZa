import { createClient } from "@/lib/supabase/server";
import ToolForm from "@/components/curator/tool-form";
import DeleteToolButton from "@/components/curator/delete-tool-button";

export const dynamic = "force-dynamic";

export default async function CuratorToolsPage() {
  const supabase = await createClient();
  const { data: tools } = await supabase.from("business_tools").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="mb-3 font-display text-[16px] font-bold text-ink">Add a business tool</h2>
      <ToolForm />

      <h2 className="mb-2.5 mt-6 font-display text-[16px] font-bold text-ink">All tools</h2>
      <div className="space-y-2">
        {(tools ?? []).map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-card border border-line bg-surface px-3.5 py-2.5">
            <div>
              <p className="text-[13.5px] font-semibold text-ink">{t.title}</p>
              <p className="text-[11px] capitalize text-ink/45">{t.tool_type}</p>
            </div>
            <DeleteToolButton id={t.id} />
          </div>
        ))}
        {(tools ?? []).length === 0 && <p className="text-[13px] text-ink/50">No tools yet.</p>}
      </div>
    </div>
  );
}
