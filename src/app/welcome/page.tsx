import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INTRO_COOKIE } from "@/lib/intro/cookie";
import WelcomeFlow from "./welcome-flow";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  // Authenticated users never need the pre-auth pitch — send them home.
  // This also covers someone manually navigating to /welcome while logged in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  // Already seen it on this device — don't force it again.
  const cookieStore = await cookies();
  const hasSeenIntro = cookieStore.get(INTRO_COOKIE)?.value === "1";
  if (hasSeenIntro) redirect("/login");

  return <WelcomeFlow />;
}
