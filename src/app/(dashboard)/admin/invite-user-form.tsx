"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inviteUser } from "@/lib/actions/users";
import { buttonStyles, formStyles } from "@/components/ui/form-styles";
import type { UserRole } from "@/types";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 12; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export function InviteUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("employee");

  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Focus name input when opened; generate default password
  useEffect(() => {
    if (open) {
      nameRef.current?.focus();
      setPassword(generatePassword());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleClose() {
    setOpen(false);
    setError(null);
    setCreatedCredentials(null);
    setEmail("");
    setFullName("");
    setPassword("");
    setRole("employee");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedCredentials(null);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }
    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const result = await inviteUser(trimmedEmail, trimmedName, role, trimmedPassword);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setCreatedCredentials({ email: trimmedEmail, password: trimmedPassword });
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("employee");
      router.refresh();
    }
  }

  function handleCopyCredentials() {
    if (!createdCredentials) return;
    const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
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
        Add User
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
              <h2 className="text-sm font-semibold text-foreground">
                {createdCredentials ? "User Created" : "Add User"}
              </h2>
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

            {/* Success state — show credentials to copy */}
            {createdCredentials ? (
              <div className="px-5 py-4">
                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                  <p className="font-medium mb-2">Account created successfully!</p>
                  <p className="text-xs text-green-600 mb-3">
                    Share these login credentials with the user:
                  </p>
                  <div className="rounded-md bg-white border border-green-200 px-3 py-2 font-mono text-xs text-foreground space-y-1">
                    <p><span className="text-muted-foreground">Email:</span> {createdCredentials.email}</p>
                    <p><span className="text-muted-foreground">Password:</span> {createdCredentials.password}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className={`${buttonStyles.small} px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20`}
                  >
                    <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                    Copy Credentials
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className={`${buttonStyles.small} bg-primary px-4 py-1.5 text-white hover:bg-primary-hover`}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="px-5 py-4">
                {error && (
                  <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="invite-password" className="mb-1 block text-xs font-medium text-foreground">
                        Temporary Password
                      </label>
                      <input
                        id="invite-password"
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${formStyles.input} py-2 text-sm font-mono`}
                        disabled={loading}
                      />
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
                        <option value="employee">Employee</option>
                        <option value="collaborator">Collaborator</option>
                        <option value="admin">Admin</option>
                        <option value="client">Client</option>
                      </select>
                    </div>
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
                    {loading ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
