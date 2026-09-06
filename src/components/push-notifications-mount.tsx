"use client";

import { usePushNotifications } from "@/lib/use-push-notifications";

/** Renders nothing — just mounts the push registration side effect. */
export default function PushNotificationsMount() {
  usePushNotifications();
  return null;
}
