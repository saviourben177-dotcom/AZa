"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { btn } from "./kit";

export function Form({
  onSubmit,
  submitLabel = "Save",
  success = "Saved",
  children,
  cancelTo,
}: {
  onSubmit: (data: Record<string, any>) => Promise<any>;
  submitLabel?: string;
  success?: string;
  children: ReactNode;
  cancelTo?: string;
}) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const data: Record<string, any> = {};
      fd.forEach((v, k) => {
        data[k] = v;
      });
      await onSubmit(data);
      toast.success(success);
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      {children}
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={busy} className={btn.primary}>
          {busy ? "Saving..." : submitLabel}
        </button>
        {cancelTo && (
          <Link href={cancelTo} className={btn.secondary}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
