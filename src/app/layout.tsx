import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import BottomNav from "@/components/bottom-nav";
import { THEME_COOKIE, isValidTheme } from "@/lib/theme/cookie";

export const metadata: Metadata = {
  title: "Aza — Opportunities, prices & businesses",
  description:
    "Find scholarships, grants, hackathons, fellowships, internships, competitions and gigs. Curator-verified prices and businesses, built for Nigeria.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF7F0",
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
    <html lang="en" data-theme={theme}>
      <body className="font-body antialiased">
        <div className="mx-auto flex min-h-screen max-w-md flex-col bg-paper">
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
