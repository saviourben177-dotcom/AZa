"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="px-5 pt-16">
      <h1 className="font-display text-[16px] font-bold text-aza">Aza</h1>
      <h2 className="mt-3 font-display text-[24px] font-bold text-ink">Welcome back</h2>
      <p className="mt-1.5 text-[13.5px] text-ink/55">
        Log in to save opportunities and manage your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label className="text-[13px] font-bold text-ink/65">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-card-sm border border-line-strong bg-surface px-4 py-3 text-[14px] shadow-card"
          />
        </div>
        <div>
          <label className="text-[13px] font-bold text-ink/65">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-card-sm border border-line-strong bg-surface px-4 py-3 text-[14px] shadow-card"
          />
        </div>

        {error && (
          <p className="rounded-card-sm bg-danger-light p-3 text-[13px] font-medium text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-pill bg-aza py-3.5 text-[14.5px] font-bold text-white shadow-glow-accent disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink/55">
        New to Aza?{" "}
        <Link href="/signup" className="font-bold text-aza">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
