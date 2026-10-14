"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BareShell, Form, TextField } from "@/components/aza/kit";
import { api } from "@/lib/aza/api";

export default function SignupPage() {
  const router = useRouter();

  return (
    <BareShell narrow>
      <h1 className="mb-6 text-3xl font-display font-bold text-foreground">Join Aza</h1>
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
