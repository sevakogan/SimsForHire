"use client";

import { useEffect } from "react";

export default function PublicWaiverError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[public waiver error]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0a0a12] text-white py-10 px-4">
      <div className="mx-auto max-w-lg rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-200">We couldn&apos;t load this waiver</h2>
        <p className="mt-2 text-sm text-red-100/80">{error.message || "Unknown error"}</p>
        {error.digest && (
          <p className="mt-2 text-[11px] font-mono text-red-300/70">digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
