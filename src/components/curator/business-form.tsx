"use client";

import { useState, useTransition, useRef } from "react";
import { createBusiness } from "@/lib/actions/businesses";
import { NIGERIA_STATES } from "@/lib/nigeria-locations";
import { COUNTRY_NAMES, type UserScope } from "@/lib/countries";

export default function BusinessForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [scope, setScope] = useState<UserScope>("nigeria");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createBusiness(formData);
      formRef.current?.reset();
      setScope("nigeria");
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-2.5 rounded-card border border-line bg-surface p-3.5"
    >
      <input
        name="name"
        placeholder="Business name"
        required
        className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
      />
      <input
        name="category"
        placeholder="Category (e.g. Catering, Electronics)"
        required
        className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
      />
      <textarea
        name="description"
        placeholder="Short description (optional)"
        rows={2}
        className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
      />
      <input
        name="location"
        placeholder="Location (optional)"
        className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setScope("nigeria")}
          className={`flex-1 rounded-card border py-2 text-[12.5px] font-semibold ${scope === "nigeria" ? "border-aza bg-aza-light text-aza" : "border-line text-ink/55"}`}
        >
          Nigeria
        </button>
        <button
          type="button"
          onClick={() => setScope("global")}
          className={`flex-1 rounded-card border py-2 text-[12.5px] font-semibold ${scope === "global" ? "border-aza bg-aza-light text-aza" : "border-line text-ink/55"}`}
        >
          Outside Nigeria
        </button>
      </div>
      <input type="hidden" name="scope" value={scope} />
      {scope === "nigeria" ? (
        <select
          name="state"
          defaultValue=""
          className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
        >
          <option value="">State (optional, for Near me search)</option>
          {NIGERIA_STATES.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
      ) : (
        <select
          name="country"
          defaultValue=""
          className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
        >
          <option value="">Country (optional, for Near me search)</option>
          {COUNTRY_NAMES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <input
          name="phone"
          placeholder="Phone"
          className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]"
        />
        <input
          name="whatsapp"
          placeholder="WhatsApp"
          className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]"
        />
      </div>
      <input
        name="email"
        type="email"
        placeholder="Email (optional)"
        className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
      />
      <div>
        <label className="text-[12.5px] font-semibold text-ink/60">
          Logo (optional)
        </label>
        <input
          name="logo"
          type="file"
          accept="image/*"
          className="mt-1 w-full text-[12.5px]"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-card bg-aza py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Add business"}
      </button>
    </form>
  );
}
