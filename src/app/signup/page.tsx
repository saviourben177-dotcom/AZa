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
      <div className="px-5 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aza-light text-2xl shadow-card">📬</div>
        <h1 className="mt-4 font-display text-[19px] font-bold text-ink">
          Check your email
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink/55">
          We sent a confirmation link to {email}. Confirm it to finish setting
          up your account.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-16">
      <h1 className="font-display text-[16px] font-bold text-aza">Aza</h1>
      <h2 className="mt-3 font-display text-[24px] font-bold text-ink">
        Create your account
      </h2>
      <p className="mt-1.5 text-[13.5px] text-ink/55">
        Save opportunities and apply faster.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label className="text-[13px] font-bold text-ink/65">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5 w-full rounded-card-sm border border-line-strong bg-surface px-4 py-3 text-[14px] shadow-card"
          />
        </div>
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
            minLength={6}
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink/55">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-aza">
          Log in
        </Link>
      </p>
    </div>
  );
}
