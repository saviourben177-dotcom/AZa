import type { Metadata } from "next";

export const meta = (title: string, description: string): Metadata => ({
  title: `${title} — Aza`,
  description,
  openGraph: {
    title: `${title} — Aza`,
    description,
  },
});
