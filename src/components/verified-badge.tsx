export default function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0 text-aza"
        aria-label="Verified"
      >
        <title>Verified by an Aza curator</title>
        <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.15" />
        <path
          d="M9 12.5l2 2 4.5-5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-pill bg-surface/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-aza backdrop-blur-sm"
      title="Verified by an Aza curator"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 12.5l2 2 4.5-5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      Verified
    </span>
  );
}
