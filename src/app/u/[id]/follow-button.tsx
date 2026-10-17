"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { btn } from "@/components/aza/kit";
import { followUser, unfollowUser } from "@/lib/actions/follows";

export default function FollowButton({
  targetId,
  initialIsFollowing,
}: {
  targetId: string;
  initialIsFollowing: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !isFollowing;
    setIsFollowing(next);
    startTransition(async () => {
      try {
        if (next) {
          await followUser(targetId);
        } else {
          await unfollowUser(targetId);
        }
      } catch (err) {
        setIsFollowing(!next);
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <button disabled={isPending} onClick={toggle} className={isFollowing ? btn.secondary : btn.primary}>
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
