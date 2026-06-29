import { createClient } from "@/lib/supabase/server";
import { koboToNaira, PRODUCT_CATEGORY_LABELS } from "@/lib/types";
import PriceForm from "@/components/curator/price-form";
import DeletePriceButton from "@/components/curator/delete-price-button";

export const dynamic = "force-dynamic";

export default async function CuratorPricesPage() {
  const supabase = await createClient();
  const { data: prices } = await supabase
    .from("prices")
    .select("*")
    .order("category")
    .order("product_name");

  return (
    <div>
      <h2 className="mb-3 font-display text-[16px] font-bold text-ink">
        Add or update a price
      </h2>
      <PriceForm />

      <h2 className="mb-2.5 mt-6 font-display text-[16px] font-bold text-ink">
        Current prices
      </h2>
      <div className="space-y-2">
        {(prices ?? []).map((price) => (
          <div
            key={price.id}
            className="flex items-center justify-between rounded-card border border-line bg-surface px-3.5 py-2.5"
          >
            <div>
              <p className="text-[13.5px] font-semibold text-ink">
                {price.product_name}
              </p>
              <p className="text-[11px] text-ink/45">
                {PRODUCT_CATEGORY_LABELS[price.category as keyof typeof PRODUCT_CATEGORY_LABELS]}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="tabular text-[14px] font-bold text-ink">
                {koboToNaira(price.price_kobo)}
              </p>
              <DeletePriceButton id={price.id} />
            </div>
          </div>
        ))}
        {(prices ?? []).length === 0 && (
          <p className="text-[13px] text-ink/50">No prices yet.</p>
        )}
      </div>
    </div>
  );
}
