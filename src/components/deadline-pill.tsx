import { daysUntil } from "@/lib/types";

export default function DeadlinePill({ deadline }: { deadline: string | null }) {
  if (!deadline) {
    return (
      <span className="rounded-pill bg-paper-dim px-3 py-1.5 text-[11px] font-semibold text-ink/50">
        No deadline
      </span>
    );
  }

  const days = daysUntil(deadline);

  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="rounded-pill bg-ink/10 px-3 py-1.5 text-[11px] font-semibold text-ink/40">
        Closed
      </span>
    );
  }

  if (days === 0) {
    return (
      <span className="rounded-pill bg-danger px-3 py-1.5 text-[11px] font-bold text-white shadow-card">
        Closes today
      </span>
    );
  }

  if (days <= 3) {
    return (
      <span className="rounded-pill bg-danger px-3 py-1.5 text-[11px] font-bold text-white shadow-card">
        ⏳ {days} day{days === 1 ? "" : "s"} left
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className="rounded-pill bg-gold px-3 py-1.5 text-[11px] font-extrabold text-[rgb(24_18_4)] shadow-card">
        ⏳ {days} days left
      </span>
    );
  }

  return (
    <span className="rounded-pill bg-aza-light px-3 py-1.5 text-[11px] font-semibold text-aza tabular">
      Due {new Date(deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
    </span>
  );
}
