import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import OpportunityForm from "@/components/curator/opportunity-form";
import { updateOpportunity } from "@/lib/actions/opportunities";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !opportunity) notFound();

  const boundAction = updateOpportunity.bind(null, id);

  return (
    <div>
      <h2 className="mb-4 font-display text-[16px] font-bold text-ink">
        Edit opportunity
      </h2>
      <OpportunityForm opportunity={opportunity} action={boundAction} />
    </div>
  );
}
