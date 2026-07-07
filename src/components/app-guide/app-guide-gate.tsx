"use client";

import { useState } from "react";
import AppGuideOverlay from "./app-guide-overlay";

export default function AppGuideGate({ shouldShow }: { shouldShow: boolean }) {
  const [visible, setVisible] = useState(shouldShow);

  if (!visible) return null;

  return <AppGuideOverlay onDone={() => setVisible(false)} />;
}
