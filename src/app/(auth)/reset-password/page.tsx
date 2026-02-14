"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import { validatePassword, validatePasswordMatch } from "@/lib/validation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwResult = validatePassword(password);
    if (!pwResult.valid) {
      setError(pwResult.error ?? "Invalid password");
      return;
    }

    const matchResult = validatePasswordMatch(password, confirmPassword);
    if (!matchResult.valid) {
      setError(matchResult.error ?? "Passwords do not match");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Sign out so user logs in fresh with new password
    await supabase.auth.signOut();
    window.location.href = "/login?message=password-updated";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">SimsForHire</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set your new password
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className={formStyles.label}>
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={formStyles.input}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className={formStyles.label}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={formStyles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${buttonStyles.primary} w-full`}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
