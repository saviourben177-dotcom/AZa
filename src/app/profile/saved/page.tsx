import { redirect } from "next/navigation";

// Saved is now a tab within /profile itself, not a separate page — keep this route alive
// as a redirect so old links/bookmarks don't 404.
export default function SavedRedirectPage() {
  redirect("/profile?tab=saved");
}
