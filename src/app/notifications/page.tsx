import Link from "next/link";

export default function NotificationsPage() {
  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">Notifications</h1>
      </div>

      <div className="mt-10 rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
        <p className="font-display text-[15px] font-bold text-ink">No notifications yet</p>
        <p className="mt-1 text-[13px] text-ink/60">
          We&apos;ll let you know about new matches, deadlines, and idea activity here.
        </p>
      </div>
    </div>
  );
}
