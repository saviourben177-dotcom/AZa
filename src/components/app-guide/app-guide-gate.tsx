"use client";

// Server-decided gate: page.tsx passes shouldShow based on the real
// has_seen_app_guide column (see markGuideSeen in lib/actions/app-guide),
// not a client-only guess — so a user who has already seen it never
// gets a flash of the overlay on reload.
import { useState } from "react";
import AppGuideOverlay from "./app-guide-overlay";

export default function AppGuideGate({ shouldShow }: { shouldShow: boolean }) {
  const [visible, setVisible] = useState(shouldShow);

  if (!visible) return null;

  return <AppGuideOverlay onDone={() => setVisible(false)} />;
}
