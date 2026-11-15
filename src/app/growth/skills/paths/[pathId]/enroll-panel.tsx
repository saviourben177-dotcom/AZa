"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { enrollInSkillPath } from "@/lib/actions/skill-paths";
import { btn } from "@/components/aza/kit";

export default function EnrollPanel({ pathId }: { pathId: string }) {
  const [isPending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      try {
        await enrollInSkillPath(pathId);
        toast.success("You're enrolled — first checkpoint is unlocked.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't start this path");
      }
    });
  }

  return (
    <div className="mb-6 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <button className={`${btn.primary} w-full`} disabled={isPending} onClick={start}>
        {isPending ? "Starting..." : "Start this path"}
      </button>
    </div>
  );
}
