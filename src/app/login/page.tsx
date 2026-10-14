"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BareShell, Form, TextField } from "@/components/aza/kit";
import { api } from "@/lib/aza/api";

export default function LoginPage() {
  const router = useRouter();

  return (
    <BareShell narrow>
      <h1 className="mb-6 text-3xl font-display font-bold text-foreground">Welcome back</h1>
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
