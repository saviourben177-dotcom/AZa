"use client";

import { useState } from "react";
import { Compass } from "lucide-react";
import { btn } from "@/components/aza/kit";
import AppGuideOverlay from "./app-guide-overlay";

// Lets a user replay the welcome tour on demand, from Settings. Reopening
// the overlay here still calls markGuideSeen on finish, same as the first
// run — harmless, since has_seen_app_guide is already true by then.
export default function ReplayGuideRow() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={btn.secondary} onClick={() => setOpen(true)}>
        <Compass className="size-4" />
        Replay App Guide
      </button>
      {open && <AppGuideOverlay onDone={() => setOpen(false)} />}
    </>
  );
}
