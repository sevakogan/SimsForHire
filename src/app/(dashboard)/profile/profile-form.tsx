"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import { useAuth } from "@/components/auth/auth-provider";
import type { Profile } from "@/types";
import { updateProfile, updateEmail, updatePassword } from "@/lib/actions/profiles";
import { uploadAvatar } from "@/lib/actions/avatar";
import { validatePassword, validatePasswordMatch } from "@/lib/validation";

interface ProfileFormProps {
  profile: Profile;
  hasPassword: boolean;
}

export function ProfileForm({ profile, hasPassword }: ProfileFormProps) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Email change state
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const displayName = profile.full_name ?? profile.email;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadAvatar(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.url) {
        setAvatarUrl(result.url);
        await refreshProfile();
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload avatar"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    setEmailSuccess(null);

    try {
      const form = new FormData(e.currentTarget);
      const fullName = (form.get("full_name") as string).trim() || null;
      const phone = (form.get("phone") as string).trim() || null;
      const newEmail = (form.get("email") as string).trim();

      // Update profile fields (name, phone)
      const result = await updateProfile(profile.id, {
        full_name: fullName,
        phone,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Update email if changed
      if (newEmail && newEmail !== profile.email) {
        setEmailSaving(true);
        const emailResult = await updateEmail(newEmail);
        setEmailSaving(false);

        if (emailResult.error) {
          setError(emailResult.error);
          return;
        }

        setEmailSuccess("Confirmation email sent to your new address.");
      }

      setSuccess("Profile updated successfully.");
      await refreshProfile();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const pwResult = validatePassword(newPassword);
    if (!pwResult.valid) {
      setPasswordError(pwResult.error ?? "Invalid password");
      return;
    }

    const matchResult = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchResult.valid) {
      setPasswordError(matchResult.error ?? "Passwords do not match");
      return;
    }

    setPasswordSaving(true);

    try {
      const result = await updatePassword(currentPassword, newPassword);

      if (result.error) {
        setPasswordError(result.error);
        return;
      }

      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-border ring-offset-2 transition-all hover:ring-primary/50 focus:outline-none focus:ring-primary/50"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
              {initials}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <svg
                className="h-6 w-6 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
                />
              </svg>
            )}
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleAvatarChange}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground">
          {uploading ? "Uploading..." : "Click to change photo"}
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}
      {emailSuccess && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-600">
          {emailSuccess}
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="email" className={formStyles.label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={profile.email}
            placeholder="you@example.com"
            className={formStyles.input}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Changing your email requires confirmation via the new address.
          </p>
        </div>

        <div className={formStyles.group}>
          <label htmlFor="phone" className={formStyles.label}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            placeholder="(555) 123-4567"
            className={formStyles.input}
          />
        </div>

        <button
          type="submit"
          disabled={saving || emailSaving}
          className={`${buttonStyles.primary} w-full`}
        >
          {saving || emailSaving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Password section */}
      {hasPassword && (
        <div className="border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Password</h3>
              <p className="text-xs text-muted-foreground">
                Update your account password
              </p>
            </div>
            {!showPasswordForm && (
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(true);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Change Password
              </button>
            )}
          </div>

          {passwordError && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {passwordSuccess}
            </div>
          )}

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
              <div className={formStyles.group}>
                <label htmlFor="current_password" className={formStyles.label}>
                  Current Password
                </label>
                <input
                  id="current_password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.group}>
                <label htmlFor="new_password" className={formStyles.label}>
                  New Password
                </label>
                <input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.group}>
                <label htmlFor="confirm_new_password" className={formStyles.label}>
                  Confirm New Password
                </label>
                <input
                  id="confirm_new_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className={formStyles.input}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className={`${buttonStyles.primary} flex-1`}
                >
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError(null);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
