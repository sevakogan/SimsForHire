"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteUser } from "@/lib/actions/users";
import { buttonStyles, formStyles, cardStyles } from "@/components/ui/form-styles";
import type { UserRole } from "@/types";

export function InviteUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("collaborator");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }
    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }

    setLoading(true);
    const result = await inviteUser(trimmedEmail, trimmedName, role);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`Invitation sent to ${trimmedEmail}`);
      setEmail("");
      setFullName("");
      setRole("collaborator");
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={buttonStyles.primary}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
        Invite User
      </button>
    );
  }

  return (
    <div className={cardStyles.base}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Invite New User</h2>
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
            setSuccess(null);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={formStyles.group}>
            <label htmlFor="invite-name" className={formStyles.label}>
              Full Name
            </label>
            <input
              id="invite-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className={formStyles.input}
              disabled={loading}
            />
          </div>

          <div className={formStyles.group}>
            <label htmlFor="invite-email" className={formStyles.label}>
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className={formStyles.input}
              disabled={loading}
            />
          </div>
        </div>

        <div className={formStyles.group}>
          <label htmlFor="invite-role" className={formStyles.label}>
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={`${formStyles.select} sm:w-48`}
            disabled={loading}
          >
            <option value="collaborator">Collaborator</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Collaborators and admins can manage projects. Clients can only view their own projects.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className={buttonStyles.primary}
          >
            {loading ? "Sending Invite..." : "Send Invite"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
              setSuccess(null);
            }}
            disabled={loading}
            className={buttonStyles.ghost}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
