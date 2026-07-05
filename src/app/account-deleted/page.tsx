import Link from "next/link";

export default function AccountDeletedPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aza-light shadow-card">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="rgb(var(--accent))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="mt-5 font-display text-[20px] font-bold text-ink">
        Your account has been deleted
      </h1>
      <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-ink/55">
        Your profile and personal data have been permanently removed from Aza. We&apos;re sorry
        to see you go.
      </p>

      <Link
        href="/"
        className="mt-6 rounded-pill bg-aza px-6 py-3.5 text-[14.5px] font-bold text-white shadow-glow-accent"
      >
        Back to Aza
      </Link>
    </div>
  );
}
