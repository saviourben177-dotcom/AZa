import { Flame } from "lucide-react";

const ACTIVITY_LABEL: Record<string, string> = {
  application_submitted: "You submitted an application",
  join_request_sent: "You sent a team join request",
  cv_updated: "You updated your CV",
  idea_posted: "You posted an idea",
};

/**
 * Visible core-loop streak badge — the part the backend-only Skills Paths
 * streak never had, which is part of why that one isn't working as a
 * retention lever. Shown on home for any user with a streak of 1+; stays
 * silent (renders nothing) at 0 so a brand new user isn't shown a "0 day
 * streak" that reads as a failure before they've done anything.
 */
export default function CoreStreakBadge({
  currentStreakDays,
  lastActivityKind,
  streakAtRiskToday,
}: {
  currentStreakDays: number;
  lastActivityKind: string | null;
  /** True when yesterday was the last counted day and today has no activity yet — streak lapses at UTC midnight if nothing qualifying happens today. */
  streakAtRiskToday: boolean;
}) {
  if (currentStreakDays < 1) return null;

  const activityLabel = lastActivityKind ? ACTIVITY_LABEL[lastActivityKind] : null;

  return (
    <div
      className={`mb-4 flex items-center gap-3 rounded-2xl border p-3.5 shadow-sm ${
        streakAtRiskToday
          ? "border-urgent/40 bg-urgent/5"
          : "border-border bg-card"
      }`}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          streakAtRiskToday ? "bg-urgent/15 text-urgent" : "bg-primary-soft text-primary-strong"
        }`}
      >
        <Flame className="size-5" fill="currentColor" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">
          {currentStreakDays} day{currentStreakDays === 1 ? "" : "s"} streak
        </p>
        <p className="text-xs text-muted-foreground">
          {streakAtRiskToday
            ? "Keep it alive — save an application, send a request, or post an idea today."
            : activityLabel ?? "Keep making real progress to grow your streak."}
        </p>
      </div>
    </div>
  );
}
