"use client";

import { supabase } from "@/lib/supabase";

export default function PendingPage() {
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
          <svg
            className="h-8 w-8 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground">Pending Approval</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is awaiting admin approval. You&apos;ll be able to access
          the platform once approved.
        </p>
        <button
          onClick={handleSignOut}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
