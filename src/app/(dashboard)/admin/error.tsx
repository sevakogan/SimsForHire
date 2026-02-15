"use client";

import { buttonStyles } from "@/components/ui/form-styles";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-foreground sm:text-2xl">Admin</h1>
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600 mb-4">
          Something went wrong loading the admin page.
        </p>
        {error.digest && (
          <p className="text-xs text-red-400 mb-4">Error ID: {error.digest}</p>
        )}
        <button onClick={reset} className={buttonStyles.primary}>
          Try Again
        </button>
      </div>
    </div>
  );
}
