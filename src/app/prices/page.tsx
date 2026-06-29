import { createClient } from "@/lib/supabase/server";
import { koboToNaira, PRODUCT_CATEGORY_LABELS, type Price } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PricesPage() {
  const supabase = await createClient();
  const { data: prices, error } = await supabase
    .from("prices")
    .select("*")
    .order("category")
    .order("product_name");

  const grouped = (prices ?? []).reduce<Record<string, Price[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="px-4 pt-6">
      <header className="mb-4">
        <h1 className="font-display text-2xl font-extrabold text-ink">Prices</h1>
        <p className="mt-0.5 text-[13px] text-ink/60">
          National average prices, verified by Aza curators.
        </p>
      </header>

      {error && (
        <p className="rounded-card bg-aza-light p-3 text-[13px] text-aza-dark">
          Couldn&apos;t load prices right now.
        </p>
      )}

      {!error && Object.keys(grouped).length === 0 && (
        <div className="rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
          <p className="text-[13px] text-ink/60">No prices added yet.</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="font-display text-[14px] font-bold text-ink/80">
              {PRODUCT_CATEGORY_LABELS[category as keyof typeof PRODUCT_CATEGORY_LABELS]}
            </h2>
            <div className="mt-2 divide-y divide-line rounded-card border border-line bg-surface">
              {items.map((price) => (
                <div
                  key={price.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-ink">
                      {price.product_name}
                    </p>
                    <p className="text-[11.5px] text-ink/45">
                      Updated{" "}
                      {new Date(price.last_updated_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                      {price.unit ? ` · per ${price.unit}` : ""}
                    </p>
                  </div>
                  <p className="tabular text-[15px] font-bold text-ink">
                    {koboToNaira(price.price_kobo)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
