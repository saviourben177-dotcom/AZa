import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewListingForm from "@/components/business/new-listing-form";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/businesses/marketplace/new");

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/businesses/marketplace" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">New Listing</h1>
      </div>
      <NewListingForm />
    </div>
  );
}
