"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="px-4 pt-12 text-center">
        <h1 className="font-display text-xl font-extrabold text-ink">
          Check your email
        </h1>
        <p className="mt-2 text-[13px] text-ink/60">
          We sent a confirmation link to {email}. Confirm it to finish setting
          up your account.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-12">
      <h1 className="font-display text-2xl font-extrabold text-ink">
        Create your account
      </h1>
      <p className="mt-1 text-[13px] text-ink/60">
        Save opportunities and apply faster.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div>
          <label className="text-[13px] font-semibold text-ink/70">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
          />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-ink/70">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
          />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-ink/70">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
          />
        </div>

        {error && (
          <p className="rounded-card bg-aza-light p-2.5 text-[13px] text-aza-dark">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-card bg-aza py-3 text-[14px] font-bold text-white disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-[13px] text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-aza">
          Log in
        </Link>
      </p>
    </div>
  );
}
