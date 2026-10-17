"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { sendJoinRequest } from "@/lib/actions/team-finder";
import { btn } from "@/components/aza/kit";

interface RoleOption {
  id: string;
  role_name: string;
  slots_needed: number;
  slots_filled: number;
}

export default function JoinRequestForm({ ideaId, roles }: { ideaId: string; roles: RoleOption[] }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await sendJoinRequest(formData);
        toast.success("Request sent");
      } catch (err: unknown) {
        if (err && typeof err === "object" && "digest" in err) throw err;
        toast.error(err instanceof Error ? err.message : "Couldn't send request");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4 rounded-lg border bg-card p-6 shadow-[var(--shadow-card)]">
      <input type="hidden" name="idea_id" value={ideaId} />

      <label className="block text-sm">
        <span className="font-medium">
          Role you want to take<span className="text-destructive"> *</span>
        </span>
        <select
          name="role_id"
          required
          className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id} disabled={r.slots_filled >= r.slots_needed}>
              {r.role_name} {r.slots_filled >= r.slots_needed ? "(full)" : `(${r.slots_needed - r.slots_filled} open)`}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="font-medium">Your experience</span>
        <textarea
          name="experience"
          rows={2}
          placeholder="e.g. 3+ years building cross-platform apps with Flutter and Firebase."
          className="mt-1.5 w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">
          Why do you want to join?<span className="text-destructive"> *</span>
        </span>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="I'm passionate about this space and believe I can help bring it to life."
          className="mt-1.5 w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">Portfolio / GitHub (optional)</span>
        <input
          name="portfolio_url"
          placeholder="github.com/yourname"
          className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>

      <button type="submit" disabled={isPending} className={`w-full ${btn.primary}`}>
        {isPending ? "Sending..." : "Send Request"}
      </button>
      <p className="pb-2 text-center text-xs text-muted-foreground">
        The project owner will review your request.
      </p>
    </form>
  );
}
