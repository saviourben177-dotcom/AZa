import { daysUntil } from "@/lib/types";

export default function DeadlinePill({ deadline }: { deadline: string | null }) {
  if (!deadline) {
    return (
      <span className="rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-semibold text-ink/50">
        No deadline
      </span>
    );
  }

  const days = daysUntil(deadline);

  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-semibold text-ink/40">
        Closed
      </span>
    );
  }

  if (days === 0) {
    return (
      <span className="rounded-full bg-danger px-2.5 py-1 text-[11px] font-bold text-white">
        Closes today
      </span>
    );
  }

  if (days <= 3) {
    return (
      <span className="rounded-full bg-danger px-2.5 py-1 text-[11px] font-bold text-white">
        {days} day{days === 1 ? "" : "s"} left
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className="rounded-full bg-urgent-light px-2.5 py-1 text-[11px] font-bold text-urgent">
        {days} days left
      </span>
    );
  }

  return (
    <span className="rounded-full bg-aza-light px-2.5 py-1 text-[11px] font-semibold text-aza tabular">
      Due {new Date(deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
    </span>
  );
}
