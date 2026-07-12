"use client";

import { useRef, useTransition } from "react";
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
}: {
  joinRequestId: string;
  messages: MessageItem[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await sendMessage(joinRequestId, formData);
      formRef.current?.reset();
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 px-5 py-5">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-[12.5px] text-text-tertiary">
            No messages yet — say hello to get started.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-card-sm px-3.5 py-2.5 shadow-card ${
                  mine ? "bg-aza text-white" : "bg-surface shadow-card text-ink"
                }`}
              >
                <p className="whitespace-pre-line text-[13px] leading-relaxed">{m.body}</p>
                <p className={`mt-1 text-[10px] font-medium ${mine ? "text-white/60" : "text-text-tertiary"}`}>
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
        className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-paper/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl"
      >
        <input
          name="body"
          required
          placeholder="Type a message..."
          autoComplete="off"
          className="min-w-0 flex-1 rounded-pill bg-surface shadow-card px-4 py-2.5 text-[13.5px] text-ink placeholder:text-text-tertiary shadow-card focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aza text-white shadow-glow-accent disabled:opacity-60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m3 11 18-8-8 18-2-8-8-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </button>
      </form>
    </div>
  );
}
