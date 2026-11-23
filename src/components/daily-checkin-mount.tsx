"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { COIN_BALANCE_EVENT } from "@/components/aza/coin-badge";

/**
 * Renders nothing — mounts once in the root layout (same pattern as
 * PushNotificationsMount) and calls award_daily_checkin_coin() for a
 * signed-in user. The function itself is idempotent per UTC day (see the
 * schema migration), so calling it on every app load is safe — it's a
 * no-op "awarded: false" response on the second+ load of the same day,
 * not a double-award. The toast only fires when a coin was actually
 * newly awarded, never on the idempotent no-op path.
 *
 * Guarded with a ref so React StrictMode's double-invoke in development
 * doesn't fire two toasts for one real award — the underlying RPC call
 * is already safe either way, this just avoids a confusing double toast
 * for the person developing against it.
 */
export default function DailyCheckinMount() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const supabase = createClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("award_daily_checkin_coin");
      if (error) {
        // Was previously silent (a missed daily coin isn't worth a toast
        // interrupting someone's session) — but that also meant a real,
        // persistent failure here (e.g. a schema/grant mismatch) would
        // never surface anywhere, to the user or to debugging. Logging
        // it to the console costs nothing and makes a real bug visible
        // to anyone checking devtools, without bothering the user with a
        // toast for what's still a minor, non-blocking feature.
        console.error("[daily-checkin] award_daily_checkin_coin failed:", error.message, error);
        return;
      }

      const row = data?.[0];
      if (row?.awarded) {
        toast.success("+1 coin for checking in today");
        window.dispatchEvent(new CustomEvent(COIN_BALANCE_EVENT, { detail: { balance: row.balance } }));
      }
    })();
  }, []);

  return null;
}
