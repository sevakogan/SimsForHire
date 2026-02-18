"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signContract } from "@/lib/actions/projects";

interface ContractSignFormProps {
  shareToken: string;
}

export function ContractSignForm({ shareToken }: ContractSignFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  const canSubmit = name.trim().length > 0 && agreed && !loading;

  async function handleSign() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signContract(shareToken, name.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setSigned(true);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (signed) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-green-800">
          Contract Signed Successfully
        </h3>
        <p className="mt-1 text-sm text-green-600">
          Thank you, {name.trim()}. You may now proceed to payment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Signing section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Sign this Contract
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Name input */}
          <div>
            <label
              htmlFor="signer-name"
              className="block text-xs font-medium text-gray-700 mb-1.5"
            >
              Full Legal Name
            </label>
            <input
              id="signer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
          </div>

          {/* Agreement checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              I have read and agree to the terms of this contract.
            </span>
          </label>

          {/* Sign button */}
          <button
            type="button"
            onClick={handleSign}
            disabled={!canSubmit}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
                Sign Contract
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
