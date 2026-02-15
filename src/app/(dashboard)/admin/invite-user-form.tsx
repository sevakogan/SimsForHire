"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inviteUser } from "@/lib/actions/users";
import { buttonStyles, formStyles } from "@/components/ui/form-styles";
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

  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Focus name input when opened
  useEffect(() => {
    if (open) nameRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setError(null);
        setSuccess(null);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleClose() {
    setOpen(false);
    setError(null);
    setSuccess(null);
    setEmail("");
    setFullName("");
    setRole("collaborator");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (!trimmedEmail) {
      setError("Email is required.");
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
      // Auto-close after short delay
      setTimeout(() => handleClose(), 1500);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={buttonStyles.primary}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Invite
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/30" />

          {/* Modal */}
          <div
            ref={dialogRef}
            className="relative w-full max-w-md rounded-xl border border-border bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Invite User</h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-5 py-4">
              {error && (
                <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                  {success}
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="invite-name" className="mb-1 block text-xs font-medium text-foreground">
                      Name
                    </label>
                    <input
                      ref={nameRef}
                      id="invite-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Smith"
                      className={`${formStyles.input} py-2 text-sm`}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="invite-email" className="mb-1 block text-xs font-medium text-foreground">
                      Email
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className={`${formStyles.input} py-2 text-sm`}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="invite-role" className="mb-1 block text-xs font-medium text-foreground">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className={`${formStyles.select} py-2 text-sm`}
                    disabled={loading}
                  >
                    <option value="collaborator">Employee</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                  </select>
                </div>
              </div>

              {/* Footer with buttons on the right */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className={`${buttonStyles.small} px-3 py-1.5 text-muted-foreground hover:bg-muted`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`${buttonStyles.small} bg-primary px-4 py-1.5 text-white hover:bg-primary-hover`}
                >
                  {loading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
