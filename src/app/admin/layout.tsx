// src/app/admin/layout.tsx
//
// Everything under /admin is gated here. This is a UX/routing convenience —
// the real enforcement is RLS on every table these pages touch. If this
// check were ever removed by mistake, RLS still prevents unauthorized
// writes; it would just produce ugly errors instead of a clean redirect.

import { requireAdmin } from "@/lib/actions/admin/require-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Aza Content Seeder</h1>
        <p className="text-sm text-neutral-500">
          Temporary launch tool — not a permanent Aza feature.
        </p>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
