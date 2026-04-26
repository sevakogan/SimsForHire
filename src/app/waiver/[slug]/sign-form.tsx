"use client";

import { useState, useTransition } from "react";
import WaiverScrollGate from "@/components/waiver/WaiverScrollGate";
import { SignaturePad } from "@/components/waiver/SignaturePad";
import { recordWaiverSignature } from "@/lib/actions/waiver-events";

interface Props {
  eventSlug: string;
  eventName: string;
  waiverBody: string;
  waiverVersion: number;
}

export function WaiverSignForm({
  eventSlug,
  eventName,
  waiverBody,
  waiverVersion,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false); // scroll gate satisfied + checkbox
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [signature, setSignature] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    name: string;
    signedAt: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!agreed) {
      setError("Please scroll the waiver to the bottom and check the agreement box.");
      return;
    }
    if (!signature) {
      setError("Please draw your signature.");
      return;
    }

    startTransition(async () => {
      const result = await recordWaiverSignature({
        eventSlug,
        name,
        phone,
        email,
        waiverVersion,
        marketingOptIn,
        signatureDataUrl: signature,
      });
      if (result.ok) {
        setSuccess({ name: name.trim(), signedAt: new Date().toLocaleString() });
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-2xl border-2 border-green-400/40 bg-gradient-to-b from-green-500/10 to-transparent p-8 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 text-5xl">
          ✓
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-green-300 font-bold mb-2">
          Show This to Attendant
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight">{success.name}</h2>
        <p className="mt-3 text-sm text-white/70">Signed {eventName} waiver</p>
        <p className="mt-1 text-[12px] text-white/50">{success.signedAt}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Verified · v{waiverVersion}
        </div>
        <p className="mt-6 text-[11px] text-white/40">
          A copy has been emailed to <span className="text-white/70">{email}</span>
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
        agreementLabel="I have read and agree to the waiver above, and consent to receive marketing communications about future events."
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
          <p className="text-[10px] text-white/40">A copy of your signed waiver will be emailed here.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-white/80">
            Phone <span className="text-white/40">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#E10600]/40 focus:border-[#E10600]"
          />
        </div>

        <label className="flex items-start gap-2 pt-1 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            style={{ accentColor: "#E10600" }}
          />
          <span className="text-[11px] leading-snug text-white/60">
            Send me updates about future Sims For Hire events. (Uncheck to opt out — you&apos;ll still receive your waiver copy.)
          </span>
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-xs uppercase tracking-wider text-white/75 font-semibold mb-2">
          Signature <span className="text-[#E10600]">*</span>
        </legend>
        <SignaturePad onChange={setSignature} />
      </fieldset>

      <button
        type="submit"
        disabled={pending || !agreed || !signature || !name.trim() || !email.trim()}
        className="w-full rounded-full bg-[#E10600] py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        {pending ? "Signing…" : "Sign & Submit"}
      </button>

      <p className="text-[10px] text-center text-white/40 leading-relaxed">
        By submitting, you provide your electronic signature with the same legal force as a handwritten one (Florida E-SIGN Act). We capture timestamp, IP, device, and the exact waiver version (v{waiverVersion}) you accepted.
      </p>
    </form>
  );
}
