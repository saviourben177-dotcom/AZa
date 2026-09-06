"use client";

import { useTransition, useRef, useState } from "react";
import { upsertPrice } from "@/lib/actions/prices";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/types";
import { COMMON_CODES } from "@/lib/currencies";

const CATEGORIES = Object.entries(PRODUCT_CATEGORY_LABELS);

export default function PriceForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [currency, setCurrency] = useState("ngn");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await upsertPrice(formData);
      formRef.current?.reset();
      setCurrency("ngn");
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2.5 rounded-card border border-line bg-surface p-3.5">
      <input
        name="product_name"
        placeholder="Product name (e.g. Rice, 50kg bag)"
        required
        className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
      />
      <div className="flex gap-2">
        <select
          name="category"
          required
          className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]"
        >
          <option value="">Category</option>
          {CATEGORIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="unit"
          placeholder="Unit (optional)"
          className="w-28 rounded-card border border-line px-3 py-2 text-[13.5px]"
        />
      </div>
      <div className="flex gap-2">
        <select
          name="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-[92px] rounded-card border border-line px-2 py-2 text-[13.5px] font-semibold"
        >
          {COMMON_CODES.map((code) => (
            <option key={code} value={code}>{code.toUpperCase()}</option>
          ))}
        </select>
        <input
          name="price_amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Price"
          required
          className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-card bg-aza py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save price"}
      </button>
    </form>
  );
}
