"use client";

// src/app/admin/businesses/business-form.tsx

import { useState } from "react";
import { createBusiness, NIGERIAN_STATES, type BusinessInput } from "@/lib/actions/admin/businesses";

export function BusinessForm({ defaultOwnerId }: { defaultOwnerId: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("saving");
    setErrorMsg("");
    try {
      const rawState = formData.get("state") as string;
      const state = (
        rawState && (NIGERIAN_STATES as readonly string[]).includes(rawState)
          ? rawState
          : null
      ) as BusinessInput["state"];

      await createBusiness(
        {
          name: String(formData.get("name")),
          category: String(formData.get("category")),
          description: (formData.get("description") as string) || null,
          location: (formData.get("location") as string) || null,
          state,
          phone: (formData.get("phone") as string) || null,
          email: (formData.get("email") as string) || null,
        },
        defaultOwnerId
      );
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to create business");
    }
  }

  return (
    <form action={handleSubmit} className="grid max-w-xl gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <input name="name" placeholder="Business name" required className="rounded border px-3 py-2" />
      <input name="category" placeholder="Category" required className="rounded border px-3 py-2" />
      <textarea name="description" placeholder="Description (max 1000 chars)" className="rounded border px-3 py-2" />
      <input name="location" placeholder="Location (e.g. Ikeja, Lagos)" className="rounded border px-3 py-2" />
      <select name="state" defaultValue="" className="rounded border px-3 py-2 text-sm">
        <option value="">No state selected</option>
        {NIGERIAN_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input name="phone" placeholder="Phone" className="rounded border px-3 py-2" />
      <input name="email" placeholder="Email" className="rounded border px-3 py-2" />

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Create business"}
      </button>

      {status === "done" && <p className="text-sm text-green-600">Created.</p>}
      {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
    </form>
  );
}
