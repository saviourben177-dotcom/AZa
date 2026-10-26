"use client";

import { useRef, useTransition } from "react";
import type { ChangeEvent } from "react";
import { Send } from "lucide-react";
import { sendMessage } from "@/lib/actions/team-finder";
import { relativeTime } from "@/lib/types";

// Cap the composer's auto-grow height so a long message scrolls inside the
// textarea instead of pushing the send button / rest of the page around.
// Kept as a plain px number (not a Tailwind class) since it has to match
// the value used in the inline style driving the auto-resize.
const MAX_COMPOSER_HEIGHT_PX = 160;

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (onSend) await onSend(formData);
      else if (joinRequestId) await sendMessage(joinRequestId, formData);
      formRef.current?.reset();
      // form.reset() clears the textarea's value but not its height, since
      // the height was set imperatively (not via React state) as the user
      // typed — collapse it back to one row for the next message.
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  // Auto-grow the textarea as the user types, up to MAX_COMPOSER_HEIGHT_PX,
  // beyond which it scrolls internally instead of growing further. Resetting
  // height to "auto" first lets scrollHeight shrink back down too (e.g.
  // after deleting lines), not just grow.
  function handleInput(e: ChangeEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT_PX)}px`;
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
        className="sticky bottom-0 flex items-end gap-2 border-t bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl"
      >
        <textarea
          ref={textareaRef}
          name="body"
          required
          placeholder="Type a message..."
          autoComplete="off"
          rows={1}
          onInput={handleInput}
          // Deliberately no onKeyDown handler here: a <textarea> never
          // submits its form on Enter on its own (unlike <input>), so Enter
          // already inserts a newline for free, with no risk of
          // double-handling composed/IME input — important on Android,
          // where keydown for Enter can report a synthetic keyCode (229)
          // during IME composition (observed back to Android 8) rather than
          // the real key, which would make a keydown-based "submit on
          // Enter unless Shift" check unreliable. Sending is the Send
          // button's job, full stop.
          className="max-h-40 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-input bg-background px-4 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
