"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import { useAuth } from "@/components/auth/auth-provider";
import type { Profile } from "@/types";
import { updateProfile } from "@/lib/actions/profiles";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const form = new FormData(e.currentTarget);
      const fullName = (form.get("full_name") as string).trim() || null;

      const result = await updateProfile(profile.id, { full_name: fullName });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      await refreshProfile();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          Profile updated successfully.
        </div>
      )}

      <div className={formStyles.group}>
        <label htmlFor="full_name" className={formStyles.label}>
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={profile.full_name ?? ""}
          placeholder="Your full name"
          className={formStyles.input}
        />
      </div>

      <div className={formStyles.group}>
        <label className={formStyles.label}>Email</label>
        <input
          type="email"
          value={profile.email}
          disabled
          className={`${formStyles.input} cursor-not-allowed opacity-60`}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Email is managed by your Google account.
        </p>
      </div>

      <button type="submit" disabled={loading} className={buttonStyles.primary}>
        {loading ? "Saving..." : "Update Profile"}
      </button>
    </form>
  );
}
