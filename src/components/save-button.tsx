"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SaveButton({
  opportunityId,
  initialSaved,
  isAuthed,
}: {
  opportunityId: string;
  initialSaved: boolean;
  isAuthed: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  function toggle() {
    if (!isAuthed) {
      router.push(`/login?next=/`);
      return;
    }

    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=/`);
        return;
      }

      if (saved) {
        await supabase
          .from("saved_opportunities")
          .delete()
          .eq("user_id", user.id)
          .eq("opportunity_id", opportunityId);
        setSaved(false);
      } else {
        await supabase
          .from("saved_opportunities")
          .insert({ user_id: user.id, opportunity_id: opportunityId });
        setSaved(true);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save this opportunity"}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-50"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={saved ? "rgb(var(--accent))" : "none"}
      >
        <path
          d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z"
          stroke={saved ? "rgb(var(--accent))" : "rgb(var(--text-secondary))"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
