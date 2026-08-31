"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { INTRO_COOKIE, INTRO_COOKIE_MAX_AGE } from "@/lib/intro/cookie";

async function markIntroSeen() {
  const cookieStore = await cookies();
  cookieStore.set(INTRO_COOKIE, "1", {
    maxAge: INTRO_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}

// Used by both "Skip" and "Get Started" — either way, the user should
// never see this intro again on this device.
export async function completeIntro() {
  await markIntroSeen();
  redirect("/");
}

export async function completeIntroAndSignUp() {
  await markIntroSeen();
  redirect("/signup");
}

export async function completeIntroAndLogIn() {
  await markIntroSeen();
  redirect("/login");
}
