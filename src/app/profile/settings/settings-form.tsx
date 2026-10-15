"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { api } from "@/lib/aza/api";
import PrivacySection from "@/components/settings/PrivacySection";
import ThemeToggle from "@/components/theme-toggle";

export default function SettingsForm({ initialIsPublic }: { initialIsPublic: boolean }) {
  const router = useRouter();

  return (
    <AppShell>
      <BackLink to="/profile" label="Profile" />
      <PageHeader title="Settings" />
      <div className="max-w-2xl space-y-8">
        <section>
          <h2 className="mb-2 text-base font-display font-bold text-foreground">Appearance</h2>
          <ThemeToggle />
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-2 text-base font-display font-bold text-foreground">
            Profile Privacy
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Control whether other members can find your profile and message you.
          </p>
          <PrivacySection initialIsPublic={initialIsPublic} />
        </section>

        <div className="flex flex-wrap gap-2 border-t pt-6">
          <button
            type="button"
            className={btn.secondary}
            onClick={async () => {
              await api.signOut();
              router.push("/login");
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            className={btn.danger}
            onClick={async () => {
              if (confirm("Delete your account? This can't be undone.")) {
                await api.deleteAccount();
                toast.success("Account deleted");
                router.push("/");
              }
            }}
          >
            Delete account
          </button>
        </div>
      </div>
    </AppShell>
  );
}
