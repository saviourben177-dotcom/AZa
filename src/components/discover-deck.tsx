"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Opportunity } from "@/lib/types";
import { OPPORTUNITY_CATEGORY_LABELS, daysUntil } from "@/lib/types";
import {
  dismissOpportunity,
  saveOpportunityFromDiscover,
  undoDismiss,
  undoSave,
} from "@/lib/actions/discover";

type Action = "saved" | "interested" | "skipped";
interface HistoryEntry {
  opportunity: Opportunity;
  action: Action;
}

const SWIPE_THRESHOLD = 90;

export default function DiscoverDeck({
  opportunities,
  isAuthed,
}: {
  opportunities: Opportunity[];
  isAuthed: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [exitAnim, setExitAnim] = useState<"left" | "right" | "up" | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const dragStart = useRef({ x: 0, y: 0 });
  const router = useRouter();

  const current = opportunities[index];
  const total = opportunities.length;

  function commit(action: Action, anim: "left" | "right" | "up") {
    if (!current) return;
    setExitAnim(anim);
    setTimeout(() => {
      if (action === "skipped" && isAuthed) dismissOpportunity(current.id);
      if ((action === "saved" || action === "interested") && isAuthed) {
        saveOpportunityFromDiscover(current.id);
      }
      setHistory((h) => [...h, { opportunity: current, action }]);
      setIndex((i) => i + 1);
      setExitAnim(null);
      setDrag({ x: 0, y: 0, active: false });
    }, 220);
  }

  function handleUndo() {
    const last = history[history.length - 1];
    if (!last) return;
    if (isAuthed) {
      if (last.action === "skipped") undoDismiss(last.opportunity.id);
      else undoSave(last.opportunity.id);
    }
    setHistory((h) => h.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.active) return;
    setDrag({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
      active: true,
    });
  }
  function onPointerUp() {
    if (!drag.active) return;
    if (drag.x > SWIPE_THRESHOLD) commit("interested", "right");
    else if (drag.x < -SWIPE_THRESHOLD) commit("skipped", "left");
    else if (drag.y < -SWIPE_THRESHOLD) commit("saved", "up");
    else setDrag({ x: 0, y: 0, active: false });
  }

  if (total === 0) {
    return (
      <div className="mt-10 rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
        <p className="font-display text-[15px] font-bold text-ink">Nothing to discover yet</p>
        <p className="mt-1 text-[13px] text-ink/60">Check back soon for new opportunities.</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mt-10 rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
        <p className="font-display text-[15px] font-bold text-ink">You&apos;re all caught up 🎉</p>
        <p className="mt-1 text-[13px] text-ink/60">Check Home or your saved list for what you&apos;ve picked.</p>
        {history.length > 0 && (
          <button onClick={handleUndo} className="mt-4 text-[13px] font-bold text-aza">
            ← Undo last
          </button>
        )}
      </div>
    );
  }

  const days = daysUntil(current.deadline);
  const nextCard = opportunities[index + 1];
  const rotation = drag.x / 18;
  const stampOpacity = Math.min(1, Math.abs(drag.x) / 80);
  const stampType = drag.x > 30 ? "interested" : drag.x < -30 ? "skip" : drag.y < -30 ? "save" : null;

  const cardStyle: React.CSSProperties = exitAnim
    ? {}
    : {
        transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
        transition: drag.active ? "none" : "transform 0.25s ease-out",
      };

  return (
    <div>
      <div className="relative mt-2 h-[440px] select-none">
        {nextCard && (
          <div className="absolute inset-x-2 top-2 h-full rounded-card border border-line bg-surface opacity-60" />
        )}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={cardStyle}
          className={`absolute inset-0 cursor-grab touch-none rounded-card border border-line bg-surface p-5 shadow-md active:cursor-grabbing ${
            exitAnim === "left" ? "anim-swipe-left" : exitAnim === "right" ? "anim-swipe-right" : exitAnim === "up" ? "anim-swipe-up" : ""
          }`}
        >
          {stampType && (
            <div
              className={`absolute right-5 top-5 rounded-lg border-4 px-3 py-1 text-[13px] font-extrabold uppercase tracking-wide ${
                stampType === "interested"
                  ? "border-aza text-aza rotate-[12deg]"
                  : stampType === "skip"
                  ? "border-danger text-danger -rotate-[12deg]"
                  : "border-urgent text-urgent"
              }`}
              style={{ opacity: stampOpacity }}
            >
              {stampType === "interested" ? "Interested" : stampType === "skip" ? "Not interested" : "Saved"}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-dim text-[14px] font-bold text-ink/40">
              {current.org.charAt(0)}
            </div>
            {current.curator_verified && (
              <span className="rounded-full bg-aza-light px-2.5 py-1 text-[11px] font-bold text-aza">✓ Verified</span>
            )}
          </div>

          <h3 className="mt-4 font-display text-[19px] font-extrabold leading-snug text-ink">{current.title}</h3>
          <p className="mt-1 text-[13px] font-medium text-ink/55">{current.org}</p>

          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-semibold text-ink/60">
              {current.remote ? "Remote" : current.location ?? "Nigeria"}
            </span>
            <span className="rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-semibold text-ink/60">
              {OPPORTUNITY_CATEGORY_LABELS[current.category]}
            </span>
          </div>

          {days !== null && days >= 0 && (
            <p className="mt-3 text-[12.5px] font-bold text-danger">⏱ {days} Day{days === 1 ? "" : "s"} Left</p>
          )}

          <p className="mt-3 line-clamp-4 text-[13.5px] leading-relaxed text-ink/70">{current.description}</p>

          {current.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {current.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-paper-dim px-2 py-0.5 text-[10.5px] font-medium text-ink/55">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] font-semibold text-ink/40">{index + 1} / {total}</p>

      <div className="mt-4 flex items-center justify-center gap-4">
        <SmallButton onClick={handleUndo} disabled={history.length === 0} />
        <ActionButton onClick={() => commit("skipped", "left")} variant="skip" />
        <ActionButton onClick={() => commit("saved", "up")} variant="save" />
        <ActionButton onClick={() => commit("interested", "right")} variant="interested" />
        <button
          onClick={() => router.push(`/opportunities/${current.id}`)}
          aria-label="View details"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-dim text-ink/60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SmallButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Undo"
      className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-dim text-ink/50 disabled:opacity-30"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 14 4 9l5-5M4 9h10a5 5 0 0 1 0 10h-1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ActionButton({ onClick, variant }: { onClick: () => void; variant: "skip" | "save" | "interested" }) {
  const styles = {
    skip: "bg-danger-light text-danger",
    save: "bg-urgent-light text-urgent",
    interested: "bg-aza-light text-aza",
  }[variant];

  const icon = {
    skip: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
    save: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="m12 2 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    interested: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  }[variant];

  const size = variant === "skip" || variant === "interested" ? "h-14 w-14" : "h-12 w-12";

  return (
    <button onClick={onClick} aria-label={variant} className={`flex ${size} items-center justify-center rounded-full shadow-sm ${styles}`}>
      {icon}
    </button>
  );
}
