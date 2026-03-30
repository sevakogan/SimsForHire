"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Connection error. Try again.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] px-4">
      <div className="w-full max-w-[340px] space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D1D1F]">
            <span className="text-sm font-bold tracking-wide text-white">S4H</span>
          </div>
          <div className="text-center">
            <h1 className="text-[26px] font-semibold tracking-tight text-[#1D1D1F]">Welcome back</h1>
            <p className="mt-1 text-[15px] text-[#86868B]">Sign in to SimsForHire Admin</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-3">
          {message === "password-updated" && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              Password updated. Sign in with your new password.
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-[14px] font-medium text-[#1D1D1F]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border-0 bg-white px-4 py-3 text-[15px] text-[#1D1D1F] placeholder:text-[#AEAEB2] shadow-sm ring-1 ring-[#E5E5E7] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-[14px] font-medium text-[#1D1D1F]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border-0 bg-white px-4 py-3 text-[15px] text-[#1D1D1F] placeholder:text-[#AEAEB2] shadow-sm ring-1 ring-[#E5E5E7] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-[#1D1D1F] py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          {error && (
            <p className="text-center text-[13px] text-[#E10600]">{error}</p>
          )}

          <Link
            href="/forgot-password"
            className="block w-full rounded-xl bg-white py-3 text-center text-[14px] text-[#86868B] shadow-sm ring-1 ring-[#E5E5E7] transition-colors hover:text-[#1D1D1F]"
          >
            Forgot Password?
          </Link>
        </form>

        {/* Back link */}
        <p className="text-center text-[13px] text-[#AEAEB2]">
          <a href="https://simsforhire.com" className="hover:text-[#86868B] transition-colors">
            ← Back to simsforhire.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7]">
          <p className="text-sm text-[#86868B]">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
