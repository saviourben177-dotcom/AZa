"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { markMicroLessonComplete } from "@/lib/actions/skill-paths";
import { btn } from "@/components/aza/kit";

export default function MarkDoneButton({
  checkpointId,
  alreadyCompleted,
}: {
  checkpointId: string;
  alreadyCompleted: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (alreadyCompleted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft p-4">
        <CheckCircle2 className="size-5 shrink-0 text-primary" />
        <p className="font-semibold text-primary-strong">Done</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await markMicroLessonComplete(checkpointId);
            toast.success("Checkpoint complete!");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't mark complete");
          }
        })
      }
      className={`${btn.primary} w-full`}
    >
      {isPending ? "Marking done..." : "Mark done"}
    </button>
  );
}
