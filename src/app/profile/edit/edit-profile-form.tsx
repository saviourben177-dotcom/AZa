"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/profile";

export default function EditProfileForm({
  currentName,
  currentAvatarUrl,
  email,
}: {
  currentName: string;
  currentAvatarUrl: string | null;
  email: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(currentName);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveAvatar(false);
    setPreview(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setPreview(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    if (removeAvatar) formData.set("remove_avatar", "1");
    startTransition(async () => {
      try {
        await updateProfile(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-5">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Profile avatar"
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-paper-dim font-display text-3xl font-extrabold text-ink/40">
              {(name || email || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[13px] font-semibold text-aza"
          >
            {preview ? "Change photo" : "Add photo"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-[13px] font-semibold text-ink/50"
            >
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Display name</label>
        <input
          name="full_name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="mt-1 w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Email</label>
        <input
          value={email}
          disabled
          className="mt-1 w-full rounded-card border border-line bg-paper-dim px-4 py-3 text-[14px] text-ink/50"
        />
        <p className="mt-1 text-[11px] text-ink/40">Email can&apos;t be changed here.</p>
      </div>

      {error && (
        <p className="rounded-card bg-aza-light p-2.5 text-[13px] text-aza-dark">{error}</p>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-card border border-line py-3.5 text-[14px] font-bold text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-card bg-aza py-3.5 text-[14px] font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
