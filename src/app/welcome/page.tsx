import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INTRO_COOKIE } from "@/lib/intro/cookie";
import WelcomeCard from "./welcome-card";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  // Authenticated users never need the pre-auth pitch — send them home.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  // Already seen it on this device — don't force it again.
  const cookieStore = await cookies();
  const hasSeenIntro = cookieStore.get(INTRO_COOKIE)?.value === "1";
  if (hasSeenIntro) redirect("/login");

  const { count } = await supabase
    .from("opportunities")
    .select("*", { count: "exact", head: true });

  return <WelcomeCard opportunityCount={count ?? 0} />;
}
