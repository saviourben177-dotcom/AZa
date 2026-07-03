import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST() {
  // 1. Identify the caller using their normal session (cookie-based, RLS-respecting client)
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2. Run the data-deletion function as the user (RLS-safe, no service role needed for this part)
  const { error: rpcError } = await supabase.rpc("delete_own_account");

  if (rpcError) {
    console.error("delete_own_account RPC failed:", rpcError);
    return NextResponse.json(
      { error: "Failed to delete account data. Please try again or contact support." },
      { status: 500 }
    );
  }

  // 3. Remove the actual auth user. This requires the service role key —
  //    a user can never delete their own auth.users row via the anon/session client.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — account data was deleted but the auth user was NOT removed."
    );
    return NextResponse.json(
      {
        error:
          "Your data was deleted, but we couldn't fully remove your account. Please contact support.",
      },
      { status: 500 }
    );
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteAuthError) {
    console.error("auth.admin.deleteUser failed:", deleteAuthError);
    return NextResponse.json(
      {
        error:
          "Your data was deleted, but we couldn't fully remove your account. Please contact support.",
      },
      { status: 500 }
    );
  }

  // 4. Sign out to clear the local session cookie
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
