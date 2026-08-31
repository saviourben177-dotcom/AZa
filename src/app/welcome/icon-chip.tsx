export function IconChip({
  icon,
  label,
  tint,
  size = "md",
}: {
  icon: React.ReactNode;
  label?: string;
  tint: "violet" | "orange" | "green" | "neutral";
  size?: "sm" | "md" | "lg";
}) {
  const tintClasses: Record<string, string> = {
    violet: "bg-[rgb(124_92_246/0.14)] text-[rgb(124_92_246)]",
    orange: "bg-[rgb(249_146_51/0.14)] text-[rgb(249_146_51)]",
    green: "bg-aza-light text-aza-dark",
    neutral: "bg-paper-dim text-ink/70",
  };
  const sizeClasses: Record<string, string> = {
    sm: "h-11 w-11 rounded-xl",
    md: "h-14 w-14 rounded-2xl",
    lg: "h-16 w-16 rounded-2xl",
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex items-center justify-center shadow-card ${tintClasses[tint]} ${sizeClasses[size]}`}
      >
        {icon}
      </div>
      {label && <span className="text-[10.5px] font-semibold text-ink/60">{label}</span>}
    </div>
  );
}
