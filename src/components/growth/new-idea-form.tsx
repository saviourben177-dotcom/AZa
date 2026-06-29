"use client";

import { useTransition } from "react";
import { createIdea } from "@/lib/actions/ideas";

const CATEGORIES = ["Education", "Energy", "Health", "Agriculture", "Fintech", "Sustainability", "Logistics", "Other"];

export default function NewIdeaForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => createIdea(formData));
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-3">
      <div>
        <label className="text-[13px] font-semibold text-ink/70">Title</label>
        <input
          name="title"
          required
          placeholder="Give your idea a short title"
          className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Description</label>
        <textarea
          name="description"
          required
          rows={5}
          placeholder="What problem does it solve? How will it work?"
          className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Category</label>
        <select name="category" className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]">
          <option value="">Select a category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Skills needed (optional)</label>
        <input
          name="skills_needed"
          placeholder="e.g. Python, UI Design, Marketing"
          className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Visibility</label>
        <div className="mt-1.5 flex gap-2">
          <label className="flex flex-1 items-center justify-center gap-1.5 rounded-card border border-line bg-surface py-2.5 text-[13px] font-medium">
            <input type="radio" name="visibility" value="public" defaultChecked className="accent-aza" /> Public
          </label>
          <label className="flex flex-1 items-center justify-center gap-1.5 rounded-card border border-line bg-surface py-2.5 text-[13px] font-medium">
            <input type="radio" name="visibility" value="private" className="accent-aza" /> Private
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-card bg-aza py-3.5 text-[15px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Posting..." : "Post Idea"}
      </button>
    </form>
  );
}
