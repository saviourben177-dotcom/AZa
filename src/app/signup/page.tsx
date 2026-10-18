"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BareShell, Form, TextField } from "@/components/aza/kit";
import { api } from "@/lib/aza/api";
import GoogleSignInButton from "@/components/google-signin-button";

function SignupForm() {
  const router = useRouter();

  return (
    <BareShell narrow>
      <h1 className="mb-6 text-3xl font-display font-bold text-foreground">Join Aza</h1>

      <GoogleSignInButton next="/onboarding" handoffPath="/signup" />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Form
        onSubmit={async (d) => {
          await api.signUp(d);
          router.push("/onboarding");
        }}
        submitLabel="Create account"
        success="Account created"
      >
        <TextField label="Full name" name="name" required />
        <TextField label="Email" name="email" type="email" required />
        <TextField
          label="Password"
          name="password"
          type="password"
          required
          hint="At least 8 characters"
        />
      </Form>
      <p className="mt-6 text-sm text-foreground">
        Have an account?{" "}
        <Link href="/login" className="font-bold text-primary-strong hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        By joining you agree to our{" "}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </BareShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
