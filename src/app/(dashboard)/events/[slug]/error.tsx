"use client";

import { useEffect } from "react";

export default function EventDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[event detail error]", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800">Couldn&apos;t load this event</h2>
      <p className="mt-1 text-sm text-red-700">{error.message || "Unknown error"}</p>
      {error.digest && (
        <p className="mt-2 text-[11px] font-mono text-red-600">digest: {error.digest}</p>
      )}
      {error.stack && (
        <pre className="mt-3 max-h-64 overflow-auto rounded bg-white/60 p-2 text-[11px] text-red-900 whitespace-pre-wrap">
          {error.stack}
        </pre>
      )}
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
      >
        Retry
      </button>
    </div>
  );
}
