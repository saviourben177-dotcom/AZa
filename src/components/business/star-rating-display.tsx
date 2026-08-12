export default function StarRatingDisplay({
  average,
  count,
  size = "sm",
}: {
  average: number;
  count: number;
  size?: "sm" | "md";
}) {
  if (count === 0) {
    return <span className="text-[11.5px] font-medium text-ink/40">No ratings yet</span>;
  }

  const dims = size === "md" ? "h-4 w-4" : "h-3 w-3";
  const rounded = Math.round(average * 2) / 2; // nearest half star

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= rounded;
          const half = !filled && i + 0.5 === rounded;
          return (
            <svg key={i} className={dims} viewBox="0 0 20 20" fill="none">
              <defs>
                {half && (
                  <linearGradient id={`half-${i}`}>
                    <stop offset="50%" stopColor="rgb(var(--gold))" />
                    <stop offset="50%" stopColor="rgb(var(--line-strong))" />
                  </linearGradient>
                )}
              </defs>
              <path
                d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77l-5.2 2.75.99-5.8-4.21-4.1 5.82-.85L10 1.5z"
                fill={filled ? "rgb(var(--gold))" : half ? `url(#half-${i})` : "rgb(var(--line-strong))"}
              />
            </svg>
          );
        })}
      </div>
      <span className={`font-bold text-ink/70 ${size === "md" ? "text-[13px]" : "text-[11.5px]"}`}>
        {average.toFixed(1)}
      </span>
      <span className={`text-ink/45 ${size === "md" ? "text-[12px]" : "text-[11px]"}`}>
        ({count})
      </span>
    </div>
  );
}
