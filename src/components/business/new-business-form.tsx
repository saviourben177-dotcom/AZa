"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBusiness } from "@/lib/actions/businesses";
import { NIGERIA_STATES } from "@/lib/nigeria-locations";
import { COUNTRY_NAMES, type UserScope } from "@/lib/countries";

const CATEGORIES = [
  "Retail / Trade", "Food & Beverage", "Fashion & Beauty", "Technology",
  "Construction", "Agriculture", "Professional Services", "Education",
  "Health & Wellness", "Transportation", "Other",
];

export default function NewBusinessForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [scope, setScope] = useState<UserScope>("nigeria");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createBusiness(formData);
      router.push("/businesses/directory");
    });
  }

  return (
    <form action={handleSubmit} className="mt-5 space-y-3">
      <div>
        <label className="text-[13px] font-semibold text-ink/70">Business name</label>
        <input name="name" required className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Category</label>
        <select name="category" required defaultValue="" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]">
          <option value="" disabled>Select a category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Description</label>
        <textarea name="description" rows={4} placeholder="What does this business do?" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Where is this business based?</label>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => setScope("nigeria")}
            className={`flex-1 rounded-card border py-2.5 text-[13.5px] font-semibold ${scope === "nigeria" ? "border-aza bg-aza-light text-aza" : "border-line bg-surface text-ink/60"}`}
          >
            Nigeria
          </button>
          <button
            type="button"
            onClick={() => setScope("global")}
            className={`flex-1 rounded-card border py-2.5 text-[13.5px] font-semibold ${scope === "global" ? "border-aza bg-aza-light text-aza" : "border-line bg-surface text-ink/60"}`}
          >
            Outside Nigeria
          </button>
        </div>
        <input type="hidden" name="scope" value={scope} />
      </div>

      {scope === "nigeria" ? (
        <div>
          <label className="text-[13px] font-semibold text-ink/70">State</label>
          <select name="state" defaultValue="" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]">
            <option value="">Select a state</option>
            {NIGERIA_STATES.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-ink/40">Used for &quot;Near me&quot; search — separate from the address below.</p>
        </div>
      ) : (
        <div>
          <label className="text-[13px] font-semibold text-ink/70">Country</label>
          <select name="country" defaultValue="" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]">
            <option value="">Select a country</option>
            {COUNTRY_NAMES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-ink/40">Used for &quot;Near me&quot; search — separate from the address below.</p>
        </div>
      )}

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Location</label>
        <input name="location" placeholder="e.g. Ikeja, Lagos" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[13px] font-semibold text-ink/70">Phone</label>
          <input name="phone" type="tel" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
        </div>
        <div className="flex-1">
          <label className="text-[13px] font-semibold text-ink/70">WhatsApp</label>
          <input name="whatsapp" type="tel" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
        </div>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Email</label>
        <input name="email" type="email" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]" />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Logo (optional)</label>
        <input name="logo" type="file" accept="image/*" className="mt-1 w-full text-[12.5px]" />
      </div>

      <p className="rounded-card-sm bg-paper-dim px-3.5 py-3 text-[11.5px] leading-relaxed text-ink/55">
        New listings are marked unverified until reviewed. Ratings from other users help others judge legitimacy.
      </p>

      <button type="submit" disabled={isPending} className="w-full rounded-pill bg-aza py-3.5 text-[14.5px] font-bold text-white shadow-glow-accent disabled:opacity-60">
        {isPending ? "Submitting..." : "Submit business"}
      </button>
    </form>
  );
}
