// Supabase Edge Function: send-push
// Called by the Postgres trigger whenever a new row lands in `notifications`.
// Looks up the user's device tokens and sends via FCM HTTP v1 API.
//
// Required secrets (set with `supabase secrets set`, see setup notes):
//   FCM_PROJECT_ID        - from google-services.json -> project_info.project_id
//   FCM_SERVICE_ACCOUNT   - full JSON string of a Firebase service-account key
//                            (Firebase Console -> Project Settings -> Service Accounts
//                             -> Generate new private key). Different from google-services.json.

import { createClient } from "jsr:@supabase/supabase-js@2";

interface NotificationPayload {
  user_id: string;
  title: string;
  body?: string | null;
  link_path?: string | null;
}

// Minimal OAuth2 access token fetch for the FCM v1 API using a service account.
async function getAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const unsigned = `${enc(header)}.${enc(claim)}`;

  const keyData = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsigned}.${encodedSig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  return data.access_token as string;
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as NotificationPayload;
    if (!payload.user_id || !payload.title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: tokens, error: tokenErr } = await supabase
      .from("device_push_tokens")
      .select("fcm_token")
      .eq("user_id", payload.user_id);

    if (tokenErr) throw tokenErr;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ skipped: "no device tokens for user" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectId = Deno.env.get("FCM_PROJECT_ID")!;
    const serviceAccount = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT")!);
    const accessToken = await getAccessToken(serviceAccount);

    const results = await Promise.all(
      tokens.map(async ({ fcm_token }) => {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token: fcm_token,
                notification: {
                  title: payload.title,
                  body: payload.body ?? "",
                },
                data: payload.link_path ? { link_path: payload.link_path } : {},
                android: { priority: "high" },
              },
            }),
          }
        );

        // Clean up tokens FCM reports as invalid/unregistered
        if (res.status === 404 || res.status === 400) {
          const errBody = await res.json().catch(() => ({}));
          const isInvalid = JSON.stringify(errBody).includes("UNREGISTERED");
          if (isInvalid) {
            await supabase.from("device_push_tokens").delete().eq("fcm_token", fcm_token);
          }
        }

        return { token: fcm_token, status: res.status };
      })
    );

    return new Response(JSON.stringify({ sent: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
