"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SaveBusinessButton({
  businessId,
  initialSaved,
  isAuthed,
}: {
  businessId: string;
  initialSaved: boolean;
  isAuthed: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthed) {
      router.push(`/login?next=/businesses/directory`);
      return;
    }

    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=/businesses/directory`);
        return;
      }

      if (saved) {
        await supabase
          .from("saved_businesses")
          .delete()
          .eq("user_id", user.id)
          .eq("business_id", businessId);
        setSaved(false);
      } else {
        await supabase
          .from("saved_businesses")
          .insert({ user_id: user.id, business_id: businessId });
        setSaved(true);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save this business"}
      className="shrink-0 rounded-full p-1.5 transition-colors disabled:opacity-50"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={saved ? "rgb(var(--accent))" : "none"}
      >
        <path
          d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z"
          stroke="rgb(var(--accent))"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
