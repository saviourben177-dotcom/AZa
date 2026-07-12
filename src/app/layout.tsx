import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/bottom-nav";
import { THEME_COOKIE, isValidTheme } from "@/lib/theme/cookie";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aza — Opportunities, prices & businesses",
  description:
    "Find scholarships, grants, hackathons, fellowships, internships, competitions and gigs. Curator-verified prices and businesses, built for Nigeria.",
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
    <html lang="en" data-theme={theme} className={`${sora.variable} ${inter.variable}`}>
      <body className="font-body antialiased">
        <div className="bg-ambient mx-auto flex min-h-screen max-w-md flex-col bg-paper">
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
