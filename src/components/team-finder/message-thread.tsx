"use client";

import { useRef, useTransition } from "react";
import { Send } from "lucide-react";
import { sendMessage } from "@/lib/actions/team-finder";
import { relativeTime } from "@/lib/types";

interface MessageItem {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export default function MessageThread({
  joinRequestId,
  messages,
  currentUserId,
  onSend,
}: {
  joinRequestId?: string;
  messages: MessageItem[];
  currentUserId: string;
  /** Optional override used by direct (profile) messaging. Defaults to the team-finder send action. */
  onSend?: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (onSend) await onSend(formData);
      else if (joinRequestId) await sendMessage(joinRequestId, formData);
      formRef.current?.reset();
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 px-4 py-5 md:px-5">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No messages yet — say hello to get started.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-lg px-3.5 py-2.5 shadow-[var(--shadow-card)] ${
                  mine ? "bg-primary text-primary-foreground" : "border bg-card text-foreground"
                }`}
              >
                <p className="whitespace-pre-line text-sm leading-relaxed">{m.body}</p>
                <p className={`mt-1 text-[10px] font-medium ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {relativeTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        ref={formRef}
        action={handleSubmit}
        className="sticky bottom-0 flex items-center gap-2 border-t bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl"
      >
        <input
          name="body"
          required
          placeholder="Type a message..."
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={isPending}
          aria-label="Send"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="size-4" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
