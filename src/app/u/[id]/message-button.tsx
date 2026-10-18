"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { btn } from "@/components/aza/kit";
import { startOrOpenConversation } from "@/lib/actions/messages";

export default function MessageButton({ targetId }: { targetId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await startOrOpenConversation(targetId);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "digest" in err) throw err;
        toast.error(err instanceof Error ? err.message : "Couldn't start conversation");
      }
    });
  }

  return (
    <button disabled={isPending} onClick={handleClick} className={btn.secondary}>
      <MessageCircle className="size-4" /> Message
    </button>
  );
}
