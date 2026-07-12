import Link from "next/link";

/**
 * notifications table does not exist (screen-mapping doc §16, confirmed
 * absent from live schema). The mockup shows a populated feed grouped by
 * Today/Yesterday with per-type icons — building that with no real data
 * source would mean showing fabricated notifications on a real user's
 * screen, which is worse than an honest empty state. This stays a true
 * empty state until the table + delivery mechanism exist.
 */
export default function NotificationsPage() {
  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="text-[19px] font-bold text-ink">Notifications</h1>
      </div>

      <div className="mt-10 rounded-card bg-surface p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-aza-light text-2xl">🔔</div>
        <p className="text-[16px] font-semibold text-ink">Notifications aren&apos;t on yet</p>
        <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
          This is coming soon — matches, deadlines, and idea activity will show up here once it&apos;s wired up.
        </p>
      </div>
    </div>
  );
}
