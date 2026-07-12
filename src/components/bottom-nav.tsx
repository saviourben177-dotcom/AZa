"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/discover", label: "Discover", icon: DiscoverIcon },
  { href: "/growth", label: "Growth", icon: GrowthIcon },
  { href: "/businesses", label: "Business", icon: BusinessIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 h-16 w-full max-w-md -translate-x-1/2 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-elevated"
      aria-label="Primary"
    >
      <ul className="flex h-16 items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="flex h-full flex-col items-center justify-center gap-0.5"
                aria-current={active ? "page" : undefined}
              >
                <tab.icon active={active} />
                <span
                  className={`text-[11px] leading-[1.2] ${
                    active ? "font-semibold text-aza" : "font-medium text-text-secondary"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const ACTIVE = "rgb(var(--accent))";
const INACTIVE = "rgb(var(--text-secondary))";

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? c : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" fill={active ? c : "none"} fillOpacity={active ? 0.12 : 0} />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" stroke={c} strokeWidth="1.6" strokeLinejoin="round" fill={active ? c : "none"} />
    </svg>
  );
}

function GrowthIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21V12M12 12C12 8 9 6 6 6c0 4 2 7 6 6ZM12 12c0-5 3-7 6-7 0 5-2 8-6 7Z"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={active ? c : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  );
}

function BusinessIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? c : "none"}
        fillOpacity={active ? 0.1 : 0}
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.2" stroke={c} strokeWidth="1.8" fill={active ? c : "none"} fillOpacity={active ? 0.15 : 0} />
      <path
        d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
