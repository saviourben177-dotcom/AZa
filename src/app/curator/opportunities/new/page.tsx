import OpportunityForm from "@/components/curator/opportunity-form";
import { createOpportunity } from "@/lib/actions/opportunities";

export default function NewOpportunityPage() {
  return (
    <div>
      <h2 className="mb-4 font-display text-[16px] font-bold text-ink">
        New opportunity
      </h2>
      <OpportunityForm action={createOpportunity} />
    </div>
  );
}
