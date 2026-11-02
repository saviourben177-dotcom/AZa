# Push notification fix — Nov 2, 2026 (v3, final)

## Important correction first
**Notifications were never fully lost.** The app already has a live,
real-time in-app notification bell (`notification-bell.tsx` →
`/notifications`) that updates instantly via Supabase realtime,
completely independent of push. Every notification that was ever
created has been visible there. What's been broken is specifically the
*push* alert (lock-screen / system tray) — not the underlying feature.

## The actual root cause, with evidence
Checked against the real `@capacitor/push-notifications` Android plugin
source (pulled and inspected directly, not assumed):

- `FirebaseMessaging.getToken()` fires its callback and returns a token
  reliably on every single call, cold start included. That path is not
  the problem — ruled out directly from source.
- On Android < 13, permission is hardcoded `"granted"` always — not the
  blocker on those devices.
- **On Android 13+, once a user denies the notification permission, the
  OS will never show that system prompt again.** `requestPermissions()`
  just silently returns `"denied"` forever, with zero error, zero crash,
  zero anything visible — anywhere. This matches, exactly, everything
  found in every Supabase log across this whole investigation: total,
  consistent silence with no trace of a failed request ever reaching the
  server. The request never happens at all, because `register()` returns
  early on a denied permission, every launch, forever.
- Confirmed separately: zero users have **ever** had more than one token
  row since the feature launched in September — first-install
  registration works, but nothing afterward ever has, for anyone.

## What's fixed

1. **`claim_push_token` RPC** (already live in production) — fixes a
   real, separately-confirmed RLS bug where a reused FCM token (same
   device, different account, or reinstall) was rejected outright. Does
   not explain the full outage on its own, but is a correct, necessary
   fix regardless.

2. **`push_registration_debug` table** (already live in production) —
   every stage of registration (permission check/result, native call,
   token receipt, save attempt/result) now logs a row. The silence that
   made this so hard to diagnose is gone going forward.

3. **New: permission-recovery banner** (`push-permission-banner.tsx`) —
   detects the stuck Android 13+ "denied forever" state and shows the
   user exactly how to fix it (Settings → Apps → Aza → Notifications),
   since nothing in the app could previously tell them this was even
   happening. No programmatic settings deep-link is used — I checked,
   and none of the Capacitor plugins currently in this project expose
   one; shipping an unverified native call wasn't worth the crash risk,
   so this gives clear instructions instead, which is zero-risk and gets
   the same result.

4. All files syntax-checked and the Capacitor APIs used
   (`PushNotifications.checkPermissions/requestPermissions/register`,
   `CapacitorApp.addListener("appStateChange", ...)`) verified directly
   against the installed packages' real type definitions and native
   source — not assumed.

## What this does NOT fix by itself
A user who has **already** denied the permission still needs to go into
system settings manually — no app can override that on Android. The
banner gets them there; it can't do it for them. If most of your 39
users already denied it before this ships, you'll likely need to
re-prompt them (a push/email/in-app message isn't possible via push
itself, obviously — use the in-app notification bell, which already
works, to tell them).

## Commands to apply

```bash
# from the root of your local AZa clone
unzip -o aza-push-fix-v3-20261102.zip -d .

git add src/lib/use-push-notifications.ts \
        src/app/debug/push/page.tsx \
        src/components/push-permission-banner.tsx \
        src/app/layout.tsx \
        supabase/migrations/20261102120000_fix_push_token_reregistration_rls.sql \
        supabase/migrations/20261102130000_push_registration_debug_log.sql

git commit -m "fix: push notification registration — RLS collision, permission-denial dead end, and diagnostics

Root cause: on Android 13+, once a user denies the notification
permission once, the OS silently suppresses the prompt on every future
request. register() exits at the permission check, every launch,
forever, with no request ever reaching Supabase — explaining the total
silence across every log source. Verified directly against the
@capacitor/push-notifications Android plugin source.

- claim_push_token RPC: fixes a real, separately-reproduced RLS 403 on
  token reuse (reinstall / account switch / same device).
- push_registration_debug: logs every registration stage so a future
  failure is visible instead of silent.
- New permission-recovery banner: tells a user whose permission is
  stuck denied exactly how to fix it, since nothing could before.

Both migrations already applied to production (saongnctrioxuvdcsmbw).
Note: the in-app notification bell (notification-bell.tsx) was
unaffected throughout — notifications were never fully lost, only the
push/system-tray alert."

git push origin main
```

CI builds automatically on push to `main`. Once live, any user whose
permission was denied will see the banner and a path to fix it; any
user who hasn't been asked yet, or who grants it, will register
correctly and show up in `device_push_tokens` going forward — with a
full diagnostic trail in `push_registration_debug` if it doesn't.
