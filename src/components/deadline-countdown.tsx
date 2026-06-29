"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DeadlineCountdown({
  opportunityId,
  title,
  deadline,
}: {
  opportunityId: string;
  title: string;
  deadline: string;
}) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; mins: number } | null>(null);

  useEffect(() => {
    function tick() {
      const target = new Date(deadline).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setRemaining({ days, hours, mins });
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <Link
      href={`/opportunities/${opportunityId}`}
      className="flex items-center justify-between rounded-card border border-line bg-surface p-4"
    >
      <div>
        <p className="line-clamp-1 text-[13px] font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-[11.5px] text-ink/55">Application closes in</p>
        {remaining && (
          <div className="mt-2 flex items-center gap-3 tabular">
            <CountUnit value={remaining.days} label="Days" />
            <CountUnit value={remaining.hours} label="Hours" />
            <CountUnit value={remaining.mins} label="Mins" />
          </div>
        )}
      </div>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="rgb(var(--accent))" strokeWidth="1.6" />
        <path d="M3 9h18M8 3v4M16 3v4" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </Link>
  );
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-[16px] font-extrabold text-aza">{String(value).padStart(2, "0")}</p>
      <p className="text-[9.5px] font-medium text-ink/45">{label}</p>
    </div>
  );
}
