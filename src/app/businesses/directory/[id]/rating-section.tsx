"use client";

import { useState } from "react";
import { toast } from "sonner";
import { btn, Stars } from "@/components/aza/kit";
import { api } from "@/lib/aza/api";

export function BusinessRatingSection({ businessId }: { businessId: string }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <section className="mt-10 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-2 text-lg font-display font-bold text-foreground">Rate this business</h2>
      <Stars value={stars} onChange={setStars} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        aria-label="Comment"
        placeholder="What was it like?"
        className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        className={`${btn.primary} mt-3`}
        disabled={!stars || submitting}
        onClick={async () => {
          setSubmitting(true);
          try {
            await api.rateBusiness(businessId, stars, comment);
            toast.success("Thanks for your rating");
            setStars(0);
            setComment("");
          } catch {
            toast.error("Failed to submit rating");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        Submit rating
      </button>
    </section>
  );
}
