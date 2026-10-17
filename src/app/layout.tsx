import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Sora, Manrope, Inter } from "next/font/google";
import "./globals.css";
import PushNotificationsMount from "@/components/push-notifications-mount";
import { THEME_COOKIE, isValidTheme } from "@/lib/theme/cookie";
import { Toaster } from "sonner";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aza — Opportunities, ideas and tools for young African founders",
  description:
    "Find scholarships, grants, hackathons, fellowships, internships, competitions and gigs. Curator-verified prices and businesses, built out of Nigeria for opportunity-seekers everywhere.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0C0B" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isValidTheme(raw) ? raw : "light";

  return (
    <html lang="en" data-theme={theme} className={`${sora.variable} ${manrope.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <PushNotificationsMount />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
