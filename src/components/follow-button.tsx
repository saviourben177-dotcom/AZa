"use client";

import { useState, useTransition } from "react";
import { followUser, unfollowUser } from "@/lib/actions/follows";

export default function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (isPending) return;
    const previous = following;
    setFollowing(!previous);
    startTransition(async () => {
      try {
        if (previous) await unfollowUser(targetUserId);
        else await followUser(targetUserId);
      } catch {
        setFollowing(previous);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={following}
      className={`flex-1 rounded-card px-4 py-3 text-[13.5px] font-bold transition-colors disabled:opacity-60 ${
        following
          ? "border border-line-strong bg-surface text-ink/70"
          : "bg-aza text-white"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
