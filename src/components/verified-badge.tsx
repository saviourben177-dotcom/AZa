export default function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-aza"
      title="Verified by an Aza curator"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 12.5l2 2 4.5-5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      Curator Verified
    </span>
  );
}
