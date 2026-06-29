import Link from "next/link";

export default function NotificationBell() {
  return (
    <Link href="/notifications" aria-label="Notifications" className="relative mt-1 shrink-0">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 9a6 6 0 1 1 12 0c0 3 1 5 1.5 6H4.5C5 14 6 12 6 9Z"
          stroke="rgb(var(--ink) / 0.7)"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="rgb(var(--ink) / 0.7)" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
