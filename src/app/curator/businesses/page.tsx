import { createClient } from "@/lib/supabase/server";
import BusinessForm from "@/components/curator/business-form";
import DeleteBusinessButton from "@/components/curator/delete-business-button";

export const dynamic = "force-dynamic";

export default async function CuratorBusinessesPage() {
  const supabase = await createClient();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("name");

  return (
    <div>
      <h2 className="mb-3 font-display text-[16px] font-bold text-ink">
        Add a business
      </h2>
      <BusinessForm />

      <h2 className="mb-2.5 mt-6 font-display text-[16px] font-bold text-ink">
        All businesses
      </h2>
      <div className="space-y-2">
        {(businesses ?? []).map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-card border border-line bg-surface px-3.5 py-2.5"
          >
            <div>
              <p className="text-[13.5px] font-semibold text-ink">{b.name}</p>
              <p className="text-[11px] text-ink/45">
                {b.category}
                {b.location ? ` · ${b.location}` : ""}
              </p>
            </div>
            <DeleteBusinessButton id={b.id} />
          </div>
        ))}
        {(businesses ?? []).length === 0 && (
          <p className="text-[13px] text-ink/50">No businesses yet.</p>
        )}
      </div>
    </div>
  );
}
