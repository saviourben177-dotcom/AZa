"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Opportunity } from "@/lib/types";
import { daysUntil } from "@/lib/types";
import { CATEGORY_IMAGE, CATEGORY_EYEBROW } from "@/lib/category-visuals";
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
      <div className="mt-10 rounded-card border border-line-strong bg-surface p-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-aza-light text-2xl">
          🔍
        </div>
        <p className="font-display text-[17px] font-bold text-ink">Nothing to discover yet</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/55">
          New opportunities land here often — check back soon.
        </p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mt-10 rounded-card border border-line-strong bg-surface p-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-aza-light text-2xl">
          🎉
        </div>
        <p className="font-display text-[17px] font-bold text-ink">You&apos;re all caught up</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/55">
          Check Home or your saved list for what you&apos;ve picked.
        </p>
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
      <div className="relative mt-2 h-[520px] select-none">
        {nextCard && (
          <div className="absolute inset-x-3 top-4 h-full scale-[0.96] rounded-card border border-line-strong bg-surface opacity-50 shadow-card" />
        )}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={cardStyle}
          className={`absolute inset-0 cursor-grab touch-none overflow-hidden rounded-card border border-line-strong bg-surface shadow-elevated active:cursor-grabbing ${
            exitAnim === "left" ? "anim-swipe-left" : exitAnim === "right" ? "anim-swipe-right" : exitAnim === "up" ? "anim-swipe-up" : ""
          }`}
        >
          {stampType && (
            <div
              className={`absolute right-5 top-5 z-10 rounded-lg border-4 px-3 py-1 text-[13px] font-extrabold uppercase tracking-wide ${
                stampType === "interested"
                  ? "border-aza text-aza rotate-[12deg] bg-surface/80"
                  : stampType === "skip"
                  ? "border-danger text-danger -rotate-[12deg] bg-surface/80"
                  : "border-gold text-gold bg-surface/80"
              }`}
              style={{ opacity: stampOpacity }}
            >
              {stampType === "interested" ? "Interested" : stampType === "skip" ? "Not interested" : "Saved"}
            </div>
          )}

          <div className="relative h-[56%] w-full">
            <Image
              src={CATEGORY_IMAGE[current.category]}
              alt=""
              fill
              sizes="448px"
              className="object-cover"
              draggable={false}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/5 to-transparent" />
            <div className="absolute left-4 right-4 top-4 flex items-start justify-between">
              <span className="rounded-pill bg-black/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                {CATEGORY_EYEBROW[current.category]}
              </span>
              {current.curator_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-white/30 bg-black/45 px-3 py-1.5 text-[11.5px] font-bold text-aza backdrop-blur-sm">
                  ✓ Verified
                </span>
              )}
            </div>
            {days !== null && days >= 0 && (
              <span className="absolute -bottom-3.5 left-4 rounded-pill bg-gold px-3.5 py-1.5 text-[11.5px] font-extrabold text-[rgb(24_18_4)] shadow-card">
                ⏳ {days} day{days === 1 ? "" : "s"} left
              </span>
            )}
          </div>

          <div className="flex h-[44%] flex-col px-5 pb-5 pt-7">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-aza" />
              <p className="text-[12px] font-semibold text-ink/55">{current.org}</p>
            </div>
            <h3 className="font-display text-[20px] font-bold leading-tight text-ink">{current.title}</h3>
            <p className="mt-1.5 text-[12.5px] text-ink/45">
              📍 {current.remote ? "Remote" : current.location ?? "Nigeria"}
            </p>

            <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink/65">{current.description}</p>

            {current.tags?.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                {current.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-lg bg-aza-light px-2.5 py-1 text-[11px] font-bold text-aza">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {Array.from({ length: Math.min(total, 6) }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index % 6 ? "w-4 bg-aza" : "w-1.5 bg-line-strong"
            }`}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <SmallButton onClick={handleUndo} disabled={history.length === 0} />
        <ActionButton onClick={() => commit("skipped", "left")} variant="skip" />
        <ActionButton onClick={() => commit("saved", "up")} variant="save" />
        <ActionButton onClick={() => commit("interested", "right")} variant="interested" />
        <button
          onClick={() => router.push(`/opportunities/${current.id}`)}
          aria-label="View details"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card"
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
      className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/45 shadow-card disabled:opacity-30"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M9 14 4 9l5-5M4 9h10a5 5 0 0 1 0 10h-1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ActionButton({ onClick, variant }: { onClick: () => void; variant: "skip" | "save" | "interested" }) {
  const styles = {
    skip: "bg-surface border border-line-strong text-danger shadow-card",
    save: "bg-surface border border-line-strong text-gold shadow-card",
    interested: "bg-aza text-white shadow-glow-accent",
  }[variant];

  const icon = {
    skip: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
    save: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="m12 2 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6L12 2Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    ),
    interested: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z" fill="currentColor" />
      </svg>
    ),
  }[variant];

  const size = variant === "interested" ? "h-16 w-16" : variant === "skip" ? "h-14 w-14" : "h-11 w-11";

  return (
    <button onClick={onClick} aria-label={variant} className={`flex ${size} items-center justify-center rounded-full transition-transform active:scale-90 ${styles}`}>
      {icon}
    </button>
  );
}
