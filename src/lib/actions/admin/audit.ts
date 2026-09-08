// src/lib/actions/admin/audit.ts
//
// Thin wrapper around the log_admin_action() Postgres function created in
// supabase/migrations/<timestamp>_admin_content_seeder_v1.sql. This is the
// ONLY way anything writes to admin_content_log — there is no INSERT policy
// on that table for any client role, by design (see migration).
//
// Removal: delete this file along with the rest of src/lib/actions/admin.
// The corresponding DB objects (admin_content_log, log_admin_action) are
// dropped via the removal procedure documented at the bottom of the
// migration file.

import { createClient } from "@/lib/supabase/server";

export type AdminAction = "create" | "update" | "delete" | "bulk_import";

export async function logAdminAction(params: {
  action: AdminAction;
  tableName: "businesses" | "idea_library" | "ideas" | "idea_roles";
  recordId?: string | null;
  summary: string;
}): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("log_admin_action", {
    p_action: params.action,
    p_table_name: params.tableName,
    // The Postgres function's actual signature is
    // (p_action text, p_table_name text, p_record_id uuid, p_summary text)
    // — p_record_id is a nullable uuid, and null is what the function
    // expects for bulk_import calls (no single row to point at). The
    // Supabase-generated RPC arg type narrows this to `string` (no `| null`)
    // even though the underlying column and function param both accept
    // null — a known gap in how the type generator handles nullable RPC
    // arguments. The cast below reflects the real DB signature, not a way
    // around it.
    p_record_id: (params.recordId ?? null) as unknown as string,
    p_summary: params.summary,
  });

  if (error) {
    // Don't let a logging failure block the actual content operation —
    // the seeder's job is to populate content, not to be an audit system.
    // Surface it loudly in server logs so it doesn't go unnoticed.
    console.error("[admin_content_log] failed to write audit entry:", error);
  }
}
