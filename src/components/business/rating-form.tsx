"use client";

import { useState, useTransition } from "react";
import { submitBusinessRating, deleteBusinessRating } from "@/lib/actions/businesses";

export default function RatingForm({
  businessId,
  existingStars,
  existingComment,
}: {
  businessId: string;
  existingStars: number | null;
  existingComment: string | null;
}) {
  const [stars, setStars] = useState(existingStars ?? 0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState(existingComment ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit() {
    if (stars < 1) {
      setError("Tap a star to rate.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await submitBusinessRating(businessId, stars, comment);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await deleteBusinessRating(businessId);
      setStars(0);
      setComment("");
      setSaved(false);
    });
  }

  const displayStars = hoverStars || stars;

  return (
    <div className="rounded-card border border-line-strong bg-surface p-4 shadow-card">
      <p className="text-[13px] font-bold text-ink">
        {existingStars ? "Update your rating" : "Rate this business"}
      </p>
      <div className="mt-2.5 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const val = i + 1;
          const filled = val <= displayStars;
          return (
            <button
              key={i}
              type="button"
              onClick={() => { setStars(val); setSaved(false); }}
              onMouseEnter={() => setHoverStars(val)}
              onMouseLeave={() => setHoverStars(0)}
              aria-label={`${val} star${val > 1 ? "s" : ""}`}
              className="p-0.5"
            >
              <svg className="h-7 w-7" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77l-5.2 2.75.99-5.8-4.21-4.1 5.82-.85L10 1.5z"
                  fill={filled ? "rgb(var(--gold))" : "rgb(var(--line-strong))"}
                />
              </svg>
            </button>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => { setComment(e.target.value); setSaved(false); }}
        placeholder="Share your experience (optional)"
        rows={3}
        className="mt-3 w-full rounded-card-sm border border-line bg-paper px-3.5 py-2.5 text-[13px]"
      />

      {error && <p className="mt-2 text-[12px] font-medium text-danger">{error}</p>}
      {saved && !isPending && <p className="mt-2 text-[12px] font-medium text-aza">Rating saved.</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 rounded-pill bg-aza py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : existingStars ? "Update rating" : "Submit rating"}
        </button>
        {existingStars !== null && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="rounded-pill border border-line-strong px-4 py-2.5 text-[13px] font-bold text-ink/60 disabled:opacity-60"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
