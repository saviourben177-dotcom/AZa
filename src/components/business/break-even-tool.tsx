"use client";

import { useState, useMemo } from "react";

export default function BreakEvenTool() {
  const [monthlyCosts, setMonthlyCosts] = useState("50000");
  const [pricePerUnit, setPricePerUnit] = useState("2000");
  const [costPerUnit, setCostPerUnit] = useState("800");

  const result = useMemo(() => {
    const fixed = parseFloat(monthlyCosts);
    const price = parseFloat(pricePerUnit);
    const cost = parseFloat(costPerUnit);
    if (isNaN(fixed) || isNaN(price) || isNaN(cost)) return null;

    const margin = price - cost;
    if (margin <= 0) return { invalid: true as const };

    const unitsNeeded = Math.ceil(fixed / margin);
    const revenueNeeded = unitsNeeded * price;
    return { invalid: false as const, margin, unitsNeeded, revenueNeeded };
  }, [monthlyCosts, pricePerUnit, costPerUnit]);

  return (
    <div className="rounded-card border border-line-strong bg-surface p-4 shadow-card">
      <div>
        <label className="text-[12.5px] font-semibold text-ink/70">Monthly running costs (₦)</label>
        <input
          type="number"
          inputMode="decimal"
          value={monthlyCosts}
          onChange={(e) => setMonthlyCosts(e.target.value)}
          className="mt-1 w-full rounded-card-sm border border-line bg-paper px-3.5 py-3 text-[15px] font-bold text-ink"
        />
        <p className="mt-1 text-[11px] text-ink/45">Rent, transport, data, restocking — everything you spend each month to keep running.</p>
      </div>

      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <label className="text-[12.5px] font-semibold text-ink/70">Price per sale (₦)</label>
          <input
            type="number"
            inputMode="decimal"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            className="mt-1 w-full rounded-card-sm border border-line bg-paper px-3.5 py-3 text-[15px] font-bold text-ink"
          />
        </div>
        <div className="flex-1">
          <label className="text-[12.5px] font-semibold text-ink/70">Cost per sale (₦)</label>
          <input
            type="number"
            inputMode="decimal"
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
            className="mt-1 w-full rounded-card-sm border border-line bg-paper px-3.5 py-3 text-[15px] font-bold text-ink"
          />
        </div>
      </div>

      <div className="mt-4 rounded-card-sm bg-aza-light p-4">
        {result?.invalid && (
          <p className="text-center text-[13px] font-medium text-danger">
            Your price needs to be higher than your cost per sale, or you lose money on every sale.
          </p>
        )}
        {result && !result.invalid && (
          <>
            <p className="text-center font-display text-[22px] font-bold text-aza">
              {result.unitsNeeded.toLocaleString()} sales/month
            </p>
            <p className="mt-1 text-center text-[11.5px] text-ink/55">
              to break even — that&apos;s ₦{result.revenueNeeded.toLocaleString()} in revenue, at a profit of ₦{result.margin.toLocaleString()} per sale.
            </p>
          </>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink/40">
        This is a simple estimate. It doesn&apos;t account for seasonal changes, discounts, or one-off startup costs.
      </p>
    </div>
  );
}
