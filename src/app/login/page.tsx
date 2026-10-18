"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BareShell, Form, TextField } from "@/components/aza/kit";
import { api } from "@/lib/aza/api";
import GoogleSignInButton from "@/components/google-signin-button";

function LoginForm() {
  const router = useRouter();

  return (
    <BareShell narrow>
      <h1 className="mb-6 text-3xl font-display font-bold text-foreground">Welcome back</h1>

      <GoogleSignInButton next="/" handoffPath="/login" />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Form
        onSubmit={async (d) => {
          await api.signIn(d);
          router.push("/");
          router.refresh();
        }}
        submitLabel="Log in"
        success="Logged in"
      >
        <TextField label="Email" name="email" type="email" required />
        <TextField label="Password" name="password" type="password" required />
      </Form>
      <p className="mt-6 text-sm text-foreground">
        New here?{" "}
        <Link href="/signup" className="font-bold text-primary-strong hover:underline">
          Create an account
        </Link>
      </p>
    </BareShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
