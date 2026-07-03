"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONFIRM_PHRASE = "DELETE";

export default function DeleteAccountSection() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = confirmText === CONFIRM_PHRASE && !isDeleting;

  async function handleDelete() {
    if (!canConfirm) return;
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      router.push("/account-deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-between rounded-card border border-danger/30 bg-danger-light px-4 py-3.5 text-left"
      >
        <span className="text-[14px] font-semibold text-danger">Delete account</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="m9 6 6 6-6 6" stroke="rgb(var(--danger))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  return (
    <div className="rounded-card border border-danger/30 bg-surface p-4">
      <p className="font-display text-[15px] font-bold text-ink">Delete your account?</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink/60">
        This permanently deletes your profile, CV Builder documents, saved and dismissed
        opportunities, ideas, and skills. Any marketplace listings or shared content you posted
        will stay up but no longer show you as the owner. This can&apos;t be undone.
      </p>

      <label className="mt-4 block text-[12px] font-semibold text-ink/70">
        Type <span className="font-bold text-danger">{CONFIRM_PHRASE}</span> to confirm
      </label>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="mt-1.5 w-full rounded-card border border-line bg-paper px-3 py-2.5 text-[14px] text-ink outline-none focus:border-danger"
        placeholder={CONFIRM_PHRASE}
        autoCapitalize="characters"
        disabled={isDeleting}
      />

      {error && <p className="mt-2.5 text-[12.5px] font-medium text-danger">{error}</p>}

      <div className="mt-4 flex gap-2.5">
        <button
          onClick={() => {
            setIsOpen(false);
            setConfirmText("");
            setError(null);
          }}
          disabled={isDeleting}
          className="flex-1 rounded-card border border-line px-4 py-3 text-[13.5px] font-semibold text-ink/70"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={!canConfirm}
          className="flex-1 rounded-card bg-danger px-4 py-3 text-[13.5px] font-bold text-white disabled:opacity-40"
        >
          {isDeleting ? "Deleting…" : "Delete forever"}
        </button>
      </div>
    </div>
  );
}
