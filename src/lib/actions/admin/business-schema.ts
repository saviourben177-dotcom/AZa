// src/lib/actions/admin/business-schema.ts
//
// Plain data + schema shared between the admin businesses server actions
// (businesses.ts, which has "use server" and can only export async
// functions) and client components (business-form.tsx,
// business-import-form.tsx). Keeping this in its own file without
// "use server" is required — a "use server" module may only export async
// functions, so a non-function export like NIGERIAN_STATES sitting in
// businesses.ts gets stripped/mangled by the server-actions bundling
// transform in production (this caused the "i.LI.map is not a function"
// crash on /admin/businesses).

import { z } from "zod";

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

// Mirrors the DB constraints on public.businesses exactly, so a row that
// passes this schema is guaranteed to pass the table's CHECK constraints too.
export const businessSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1),
  logo_url: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  location: z.string().optional().nullable(),
  state: z.enum(NIGERIAN_STATES).optional().nullable(),
  region: z.string().optional().nullable(),
});

export type BusinessInput = z.infer<typeof businessSchema>;
