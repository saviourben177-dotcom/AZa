"use client";

import { useTransition, useRef } from "react";
import { upsertPrice } from "@/lib/actions/prices";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/types";

const CATEGORIES = Object.entries(PRODUCT_CATEGORY_LABELS);

export default function PriceForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await upsertPrice(formData);
      formRef.current?.reset();
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
      <input
        name="price_naira"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Price in ₦"
        required
        className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
      />
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
