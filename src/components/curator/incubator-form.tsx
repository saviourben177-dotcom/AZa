"use client";

import { useTransition, useRef } from "react";
import { createIncubator } from "@/lib/actions/incubators";

export default function IncubatorForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createIncubator(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2.5 rounded-card border border-line bg-surface p-3.5">
      <input name="name" placeholder="Incubator / accelerator name" required className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <textarea name="description" placeholder="Description (optional)" rows={3} className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <input name="focus_area" placeholder="Focus area (e.g. Fintech, Agritech)" className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <div className="flex gap-2">
        <input name="location" placeholder="Location" className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]" />
        <input name="deadline" type="date" className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]" />
      </div>
      <input name="application_url" type="url" placeholder="Application URL (optional)" className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <div className="flex gap-4 text-[12.5px] text-ink/70">
        <label className="flex items-center gap-1.5"><input type="checkbox" name="remote" className="accent-aza" /> Remote</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" name="curator_verified" className="accent-aza" /> Verified</label>
      </div>
      <button type="submit" disabled={isPending} className="w-full rounded-card bg-aza py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Add incubator"}
      </button>
    </form>
  );
}
