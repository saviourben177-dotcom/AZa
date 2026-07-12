"use client";

import { useTransition } from "react";
import { sendJoinRequest } from "@/lib/actions/team-finder";

interface RoleOption {
  id: string;
  role_name: string;
  slots_needed: number;
  slots_filled: number;
}

export default function JoinRequestForm({
  ideaId,
  roles,
}: {
  ideaId: string;
  roles: RoleOption[];
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => sendJoinRequest(formData));
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      <input type="hidden" name="idea_id" value={ideaId} />

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Role you want to take</label>
        <select
          name="role_id"
          required
          className="mt-1.5 w-full rounded-card bg-surface shadow-card px-4 py-3 text-[14px] text-ink shadow-card"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id} disabled={r.slots_filled >= r.slots_needed}>
              {r.role_name} {r.slots_filled >= r.slots_needed ? "(full)" : `(${r.slots_needed - r.slots_filled} open)`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Your experience</label>
        <textarea
          name="experience"
          rows={2}
          placeholder="e.g. 3+ years building cross-platform apps with Flutter and Firebase."
          className="mt-1.5 w-full resize-none rounded-card bg-surface shadow-card px-4 py-3 text-[13.5px] text-ink placeholder:text-text-tertiary shadow-card"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Why do you want to join?</label>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="I'm passionate about education and AI. I believe I can help bring this idea to life and create real impact."
          className="mt-1.5 w-full resize-none rounded-card bg-surface shadow-card px-4 py-3 text-[13.5px] text-ink placeholder:text-text-tertiary shadow-card"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Portfolio / GitHub (optional)</label>
        <input
          name="portfolio_url"
          placeholder="github.com/yourname"
          className="mt-1.5 w-full rounded-card bg-surface shadow-card px-4 py-3 text-[13.5px] text-ink placeholder:text-text-tertiary shadow-card"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-card bg-aza py-3.5 text-[14.5px] font-semibold text-white shadow-glow-accent disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m3 11 18-8-8 18-2-8-8-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        {isPending ? "Sending..." : "Send Request"}
      </button>
      <p className="pb-4 text-center text-[11.5px] text-text-tertiary">
        The project owner will review your request.
      </p>
    </form>
  );
}
