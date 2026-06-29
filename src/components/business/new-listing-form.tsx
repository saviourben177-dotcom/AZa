"use client";

import { useTransition, useState } from "react";
import { createListing } from "@/lib/actions/marketplace";

export default function NewListingForm() {
  const [isPending, startTransition] = useTransition();
  const [listingType, setListingType] = useState("sell");

  function handleSubmit(formData: FormData) {
    startTransition(() => createListing(formData));
  }

  return (
    <form action={handleSubmit} className="mt-5 space-y-3">
      <div>
        <label className="text-[13px] font-semibold text-ink/70">What is this?</label>
        <select
          name="listing_type"
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
          className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]"
        >
          <option value="sell">Selling something</option>
          <option value="buy">Looking to buy</option>
          <option value="collaborate">Looking to collaborate</option>
          <option value="service">Offering a service</option>
        </select>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Title</label>
        <input name="title" required className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Description</label>
        <textarea name="description" required rows={4} className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Category (optional)</label>
        <input name="category" placeholder="e.g. Electronics, Crafts, Software" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
      </div>

      {listingType === "sell" && (
        <div>
          <label className="text-[13px] font-semibold text-ink/70">Price in ₦ (optional)</label>
          <input name="price_naira" type="number" step="0.01" min="0.01" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
        </div>
      )}

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Location (optional)</label>
        <input name="location" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[13px] font-semibold text-ink/70">Phone</label>
          <input name="contact_phone" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
        </div>
        <div className="flex-1">
          <label className="text-[13px] font-semibold text-ink/70">WhatsApp</label>
          <input name="contact_whatsapp" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
        </div>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Photo (optional)</label>
        <input name="image" type="file" accept="image/*" className="mt-1 w-full text-[12.5px]" />
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-card bg-aza py-3.5 text-[15px] font-bold text-white disabled:opacity-60">
        {isPending ? "Posting..." : "Post Listing"}
      </button>
    </form>
  );
}
