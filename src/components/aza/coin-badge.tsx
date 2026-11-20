"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";

/** Fired by DailyCheckinMount right after a coin is actually newly awarded, so any CoinBadge already on screen updates without a full page reload. */
export const COIN_BALANCE_EVENT = "aza:coin-balance-changed";

/**
 * Compact coin-balance pill for a page header (Courses, Prep). Unlike
 * CoreStreakBadge (a full-width hero card on Home), this sits inline next
 * to a PageHeader — the coin balance is a persistent, low-key status, not
 * a daily "keep this alive" nudge, so it doesn't need that much weight.
 * Uses the existing --gold token (already used by deadline-pill.tsx and
 * application-status-control.tsx) rather than introducing a new color.
 *
 * Renders the server-provided initialBalance immediately (no flash of
 * zero), then stays in sync with same-tab balance changes — the daily
 * check-in mount, or an unlock/quiz action elsewhere on the same page —
 * via a small custom event rather than polling or a realtime
 * subscription, since this is a low-stakes, same-tab-only display value.
 */
export default function CoinBadge({ balance: initialBalance }: { balance: number }) {
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    setBalance(initialBalance);
  }, [initialBalance]);

  useEffect(() => {
    function handleBalanceChange(e: Event) {
      const detail = (e as CustomEvent<{ balance: number }>).detail;
      if (typeof detail?.balance === "number") setBalance(detail.balance);
    }
    window.addEventListener(COIN_BALANCE_EVENT, handleBalanceChange);
    return () => window.removeEventListener(COIN_BALANCE_EVENT, handleBalanceChange);
  }, []);

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/30 bg-gold-light px-3 py-1.5 text-sm font-bold text-gold">
      <Coins className="size-4" />
      {balance.toLocaleString()}
    </span>
  );
}
