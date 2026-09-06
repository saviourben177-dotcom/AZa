# Push Notifications Setup — AZa

Everything code-side is done. What's left is a handful of one-time manual
steps (secrets/config that only you can supply).

## What this zip changed

- `package.json` — added `@capacitor/push-notifications`
- `src/app/layout.tsx` — mounts push registration on app load
- `src/components/push-notifications-mount.tsx` — new, mounts the hook
- `src/lib/use-push-notifications.ts` — new, registers device + saves FCM token
- `supabase/migrations/001_push_notifications.sql` — new table + trigger
- `supabase/functions/send-push/index.ts` — new Edge Function, sends via FCM

No changes were needed to `android/build.gradle` or `android/app/build.gradle`
— the google-services Gradle plugin was already wired in, just waiting for
the config file.

## Manual steps (one-time)

### 1. Drop in your Firebase config file
Place the `google-services.json` you already have at:
```
android/app/google-services.json
```

### 2. Get a Firebase service account key (different file — for sending, not receiving)
This is NOT the same as google-services.json. In the Firebase Console:
Project Settings → Service Accounts → "Generate new private key".
This downloads a second JSON file. Keep it safe, don't commit it.

### 3. Apply the Supabase migration
Run `supabase/migrations/001_push_notifications.sql` against your AZA
project (SQL editor, or `supabase db push` if you use the CLI).

Then, in the Supabase SQL editor, run these two lines with your real values
(these are secrets — deliberately not in the migration file / git):
```sql
alter database postgres set app.settings.supabase_url = 'https://saongnctrioxuvdcsmbw.supabase.co';
alter database postgres set app.settings.service_role_key = '<your service_role key, from Project Settings -> API>';
```

### 4. Deploy the Edge Function and set its secrets
```
supabase functions deploy send-push --project-ref saongnctrioxuvdcsmbw

supabase secrets set --project-ref saongnctrioxuvdcsmbw \
  FCM_PROJECT_ID=<project_id from google-services.json, under project_info> \
  FCM_SERVICE_ACCOUNT='<paste the full contents of the service-account JSON from step 2 as one line>'
```
(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already available to
every Edge Function automatically — no need to set those.)

### 5. Rebuild the Android app
Since this adds a native plugin, a plain zip-and-push isn't enough this time —
Capacitor needs to sync the new plugin into the Android project. After
`git push`, either let CI build the AAB as usual (it runs `npx cap sync
android` as part of the build) — or if testing locally first:
```
npx cap sync android
```

## How it works end to end

1. App opens on a real Android device → `usePushNotifications()` asks for
   permission → registers with FCM → gets a token → saves it to
   `device_push_tokens` in Supabase.
2. Whenever any part of the app inserts a row into `public.notifications`
   (in-app notification), a Postgres trigger automatically calls the
   `send-push` Edge Function.
3. The function looks up all of that user's device tokens and sends a push
   via FCM to each one.
4. If FCM reports a token as invalid/uninstalled, it's deleted automatically.

Nothing needs to change in the app's *feature* code going forward — any
future feature that writes to `notifications` gets push for free.

## Testing

Once steps 1-5 are done, you can manually test the whole pipeline without
building a feature that writes to `notifications` yet — just insert a test
row directly:
```sql
insert into public.notifications (user_id, type, title, body)
values ('<your own user id>', 'system', 'Test push', 'If you see this, it worked');
-- valid `type` values: join_request_received, join_request_accepted,
-- join_request_declined, new_message, deadline_reminder, opportunity_match,
-- idea_upvote, system
```
That insert should trigger a push to your device within a few seconds.
