"use client";

/**
 * Circular stat ring — spec §9.8. `unavailable` renders a dashed/muted ring
 * with an em-dash instead of a number, for stats with no backing data yet
 * (e.g. "Applications" — no applications table exists).
 */
export default function ProgressRing({
  value,
  max,
  label,
  unavailable = false,
}: {
  value: number;
  max: number;
  label: string;
  unavailable?: boolean;
}) {
  const size = 64;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = unavailable ? 0 : Math.min(1, max > 0 ? value / max : 0);
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(var(--paper-dim))"
            strokeWidth={stroke}
          />
          {!unavailable && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[16px] font-bold ${unavailable ? "text-text-tertiary" : "text-ink"}`}>
            {unavailable ? "—" : value}
          </span>
        </div>
      </div>
      <span className="text-[11.5px] font-medium text-text-secondary">{label}</span>
    </div>
  );
}
