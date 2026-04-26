"use client";

import { useState, useTransition } from "react";
import WaiverScrollGate from "@/components/waiver/WaiverScrollGate";
import { recordWaiverSignature } from "@/lib/actions/waiver-events";

interface Props {
  eventSlug: string;
  waiverBody: string;
  waiverVersion: number;
}

export function WaiverSignForm({ eventSlug, waiverBody, waiverVersion }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Please fill in name, phone, and email.");
      return;
    }
    if (!agreed) {
      setError("You must read and agree to the waiver before signing.");
      return;
    }

    startTransition(async () => {
      const result = await recordWaiverSignature({
        eventSlug,
        name,
        phone,
        email,
        waiverVersion,
      });
      if (result.ok) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-3xl">
          ✓
        </div>
        <h2 className="text-xl font-bold">Signed</h2>
        <p className="mt-2 text-sm text-white/60">
          Thanks, {name.split(" ")[0]}. Your signature has been recorded.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[13px] text-red-300">
          {error}
        </div>
      )}

      <WaiverScrollGate
        body={waiverBody}
        onAgreedChange={setAgreed}
        brandColor="#E10600"
      />

      <fieldset className="space-y-3 pt-2">
        <legend className="text-xs uppercase tracking-wider text-white/75 font-semibold mb-1">
          Your Information
        </legend>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-white/80">
            Full Name <span className="text-[#E10600]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#E10600]/40 focus:border-[#E10600]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-white/80">
            Phone <span className="text-[#E10600]">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#E10600]/40 focus:border-[#E10600]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-white/80">
            Email <span className="text-[#E10600]">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#E10600]/40 focus:border-[#E10600]"
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending || !agreed}
        className="w-full rounded-full bg-[#E10600] py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        {pending ? "Signing…" : "Sign & Submit"}
      </button>
    </form>
  );
}
