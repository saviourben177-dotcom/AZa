"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
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
        toast.success("Profile updated");
        router.push("/profile");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <AppShell>
      <BackLink to="/profile" label="Profile" />
      <PageHeader title="Edit profile" />

      <form action={handleSubmit} className="space-y-5">
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
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted font-display text-3xl font-extrabold text-muted-foreground">
                {(name || email || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-semibold text-primary"
            >
              {preview ? "Change photo" : "Add photo"}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-sm font-semibold text-muted-foreground"
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

        <label className="block text-sm">
          <span className="font-medium">
            Full name<span className="text-destructive"> *</span>
          </span>
          <input
            name="full_name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Email</span>
          <input
            value={email}
            disabled
            className="mt-1.5 h-11 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Email can&apos;t be changed here.
          </span>
        </label>

        {error && <p className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">{error}</p>}

        <div className="flex gap-2.5">
          <button type="button" onClick={() => router.back()} className={`flex-1 ${btn.secondary}`}>
            Cancel
          </button>
          <button type="submit" disabled={isPending} className={`flex-1 ${btn.primary}`}>
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
