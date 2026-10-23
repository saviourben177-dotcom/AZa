"use client";

import { useRouter } from "next/navigation";
import { Mail, Star } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { api } from "@/lib/aza/api";
import PrivacySection from "@/components/settings/PrivacySection";
import ThemeToggle from "@/components/theme-toggle";
import ReplayGuideRow from "@/components/app-guide/replay-guide-row";

export default function SettingsForm({ initialIsPublic }: { initialIsPublic: boolean }) {
  const router = useRouter();
  const feedbackEmail = "azatechnologies@atomicmail.io";
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.azatechnologies.aza&showAllReviews=true";

  function leaveReview() {
    if (Capacitor.isNativePlatform()) {
      // Android resolves this directly to the Play Store app. The HTTPS link
      // below remains the fallback for browsers and unsupported devices.
      window.location.assign("market://details?id=com.azatechnologies.aza&showAllReviews=true");
      return;
    }
    window.open(playStoreUrl, "_blank", "noopener,noreferrer");
  }

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
          <h2 className="mb-2 text-base font-display font-bold text-foreground">App Guide</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Replay the welcome tour that covers Discover, CV Builder, Growth Hub and Business Hub.
          </p>
          <ReplayGuideRow />
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

        <section className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-base font-display font-bold text-foreground">Support Aza</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Share feedback or leave a review to help us improve Aza.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a
              href={`mailto:${feedbackEmail}?subject=${encodeURIComponent("Aza app feedback")}`}
              className={btn.secondary}
            >
              <Mail className="size-4" /> Send feedback
            </a>
            <button type="button" className={btn.secondary} onClick={leaveReview}>
              <Star className="size-4" /> Rate Aza on Google Play
            </button>
          </div>
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
