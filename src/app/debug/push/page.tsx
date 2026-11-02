"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { pushDebugState } from "@/lib/use-push-notifications";

interface DebugRow {
  id: string;
  event: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Visit /debug/push on a real device to see exactly how far push
 * registration got — no adb required. Shows the live in-memory state plus
 * the last 50 logged events for the signed-in user, pulled straight from
 * push_registration_debug.
 */
export default function PushDebugPage() {
  const [rows, setRows] = useState<DebugRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    if (user) {
      const { data } = await supabase
        .from("push_registration_debug")
        .select("id, event, detail, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setRows(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Push Debug</h1>

      <div style={{ marginBottom: 16, padding: 12, background: "#111", color: "#0f0", borderRadius: 8 }}>
        <div>user_id: {userId ?? "(not signed in)"}</div>
        <div>current FCM token: {pushDebugState.latestToken ?? "(none yet)"}</div>
        <div>last event: {pushDebugState.lastEvent ?? "(none)"}</div>
        <div>last error: {pushDebugState.lastError ?? "(none)"}</div>
      </div>

      <button
        onClick={() => void load()}
        style={{ padding: "8px 16px", marginBottom: 16 }}
      >
        Refresh
      </button>

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div>No events logged yet for this account.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
              <th>time</th>
              <th>event</th>
              <th>detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ whiteSpace: "nowrap", paddingRight: 8 }}>
                  {new Date(r.created_at).toLocaleTimeString()}
                </td>
                <td style={{ paddingRight: 8 }}>{r.event}</td>
                <td>{r.detail ? JSON.stringify(r.detail) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
