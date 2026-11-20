"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Lock, Coins } from "lucide-react";
import { toast } from "sonner";
import { btn } from "@/components/aza/kit";
import { unlockCourse } from "@/lib/actions/courses";
import { COIN_BALANCE_EVENT } from "@/components/aza/coin-badge";

/**
 * Shown in place of the reader for a gated course the user hasn't
 * unlocked yet. Spending happens server-side in unlock_course() — this
 * component only displays the result and, on success, asks the parent to
 * reveal the reader (via onUnlocked) rather than doing a full page reload.
 */
export default function UnlockGate({
  courseId,
  cost,
  coinBalance,
  isAuthed,
  onUnlocked,
}: {
  courseId: string;
  cost: number;
  coinBalance: number;
  isAuthed: boolean;
  onUnlocked: (newBalance: number) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState(coinBalance);
  const router = useRouter();

  function handleUnlock() {
    if (!isAuthed) {
      router.push(`/login?next=/growth/courses/${courseId}`);
      return;
    }

    startTransition(async () => {
      try {
        const result = await unlockCourse(courseId);
        setBalance(result.newBalance);
        window.dispatchEvent(new CustomEvent(COIN_BALANCE_EVENT, { detail: { balance: result.newBalance } }));
        if (result.success) {
          toast.success("Unlocked!");
          onUnlocked(result.newBalance);
        } else if (result.reason === "insufficient_balance") {
          toast.error("Not enough coins yet — earn more with a daily check-in or a Prep quiz.");
        } else {
          toast.error("Couldn't unlock that course.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't unlock that course.");
      }
    });
  }

  const canAfford = balance >= cost;

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-gold-light text-gold">
        <Lock className="size-6" />
      </span>
      <div>
        <p className="font-display text-lg font-bold text-foreground">This course is locked</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Unlock it for {cost} coins to start reading.
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gold">
        <Coins className="size-4" />
        You have {balance} coins
      </div>
      <button
        type="button"
        onClick={handleUnlock}
        disabled={isPending || (isAuthed && !canAfford)}
        className={btn.primary}
      >
        {isPending ? "Unlocking…" : `Unlock for ${cost} coins`}
      </button>
      {isAuthed && !canAfford ? (
        <p className="text-xs text-muted-foreground">
          Earn more with a daily check-in or by completing a Prep quiz (+10 coins).
        </p>
      ) : null}
    </div>
  );
}
