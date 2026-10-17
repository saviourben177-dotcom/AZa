"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markSavedOpportunitiesSeen } from "@/lib/actions/applications";

/**
 * Mounted on the Saved > Opportunities view. Marks any unseen saved
 * opportunities as seen and refreshes the router so the Profile tab's
 * unseen-count badge (rendered in the root layout) clears immediately.
 * Renders nothing.
 */
export default function MarkSavedSeen() {
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    markSavedOpportunitiesSeen().then(() => router.refresh());
  }, [router]);

  return null;
}
