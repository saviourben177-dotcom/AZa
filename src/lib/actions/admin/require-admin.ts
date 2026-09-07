// src/lib/actions/admin/require-admin.ts
//
// Isolated to the admin seeder. Nothing outside src/app/admin and
// src/lib/actions/admin should import from this file. If you're tempted to
// reuse this in a non-admin part of the app, stop — that's exactly the kind
// of coupling that makes this tool hard to remove later. Add a proper
// shared auth helper elsewhere instead.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AdminSession = {
  userId: string;
  role: "admin" | "editorial";
};

/**
 * Verifies the current session belongs to a profile with role 'admin'.
 * Redirects to /login if unauthenticated, and to / if authenticated but
 * not an admin. This is a UX gate only — RLS on every table this tool
 * touches is the actual enforcement layer, so a bug here cannot itself
 * grant unauthorized writes.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/");
  }

  return { userId: user.id, role: profile.role };
}

/**
 * Looks up the @Aza editorial identity's profile id. Used when the admin
 * chooses "post as @Aza" instead of assigning content to their own account.
 * Throws if the editorial profile doesn't exist — fail loudly rather than
 * silently falling back to some other id.
 */
export async function getEditorialProfileId(): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "editorial")
    .single();

  if (error || !data) {
    throw new Error(
      "No profile with role='editorial' found. The @Aza identity is expected to exist — check profiles table."
    );
  }

  return data.id;
}
