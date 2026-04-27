"use client";

import { useState, useTransition } from "react";
import WaiverScrollGate from "@/components/waiver/WaiverScrollGate";
import { SignaturePad } from "@/components/waiver/SignaturePad";
import { recordWaiverSignature } from "@/lib/actions/waiver-events";
import { pickF1Quote } from "@/lib/f1-quotes";

interface Props {
  eventSlug: string;
  eventName: string;
  waiverBody: string;
  waiverVersion: number;
}

// Miami F1 Fan Fest palette
const MIAMI_PINK = "#FF5BA7";
const MIAMI_BLUE = "#7BD0F5";

export function WaiverSignForm({
  eventSlug,
  eventName,
  waiverBody,
  waiverVersion,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
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
    const quote = pickF1Quote(success.name);
    const firstName = success.name.split(" ")[0];

    return (
      <div className="space-y-5">
        {/* SHOW TO ATTENDANT — visible from 5-7ft away */}
        <div
          className="rounded-3xl border-4 p-6 text-center shadow-2xl"
          style={{
            borderColor: MIAMI_PINK,
            background: `linear-gradient(135deg, rgba(255,91,167,0.18) 0%, rgba(123,208,245,0.18) 100%)`,
          }}
        >
          <div
            className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full text-5xl font-black"
            style={{ background: MIAMI_PINK, color: "#0a0a12" }}
          >
            ✓
          </div>

          <p
            className="text-[13px] font-extrabold uppercase tracking-[0.3em] mb-2"
            style={{ color: MIAMI_BLUE }}
          >
            Show This to Attendant
          </p>

          <h2 className="text-5xl font-black tracking-tight leading-none break-words">
            {success.name}
          </h2>

          <p className="mt-4 text-xl font-bold text-white/90">{eventName}</p>
          <p className="mt-1 text-base text-white/70">Waiver signed ✓</p>
          <p className="mt-1 text-sm text-white/50">{success.signedAt}</p>

          <div
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] uppercase tracking-wider font-extrabold"
            style={{ background: MIAMI_BLUE, color: "#0a0a12" }}
          >
            <span className="h-2 w-2 rounded-full bg-[#0a0a12]" />
            Verified · v{waiverVersion}
          </div>
        </div>

        {/* Excited thank-you */}
        <div className="text-center px-2">
          <p className="text-2xl font-extrabold leading-tight">
            Thanks, {firstName}! 🏁
          </p>
          <p className="mt-1 text-base font-medium text-white/80">
            Hope you enjoy the simulators.
          </p>
        </div>

        {/* F1 quote */}
        <blockquote
          className="rounded-2xl border-l-4 px-4 py-4 italic text-white/85"
          style={{
            borderColor: MIAMI_BLUE,
            background: "rgba(123,208,245,0.08)",
          }}
        >
          <p className="text-[15px] leading-snug">&ldquo;{quote.text}&rdquo;</p>
          <footer className="mt-2 text-[11px] uppercase tracking-wider font-bold text-white/55">
            — {quote.driver}
          </footer>
        </blockquote>

        {/* CTAs */}
        <div className="grid grid-cols-1 gap-3">
          <a
            href="https://simsforhire.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border-2 p-4 transition-transform active:scale-[0.98]"
            style={{ borderColor: MIAMI_BLUE, background: "rgba(123,208,245,0.08)" }}
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
              style={{ background: MIAMI_BLUE, color: "#0a0a12" }}
            >
              🏠
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-extrabold" style={{ color: MIAMI_BLUE }}>
                10% Off
              </p>
              <p className="text-lg font-extrabold leading-tight">Rent Our Sims</p>
              <p className="text-[11px] text-white/60 truncate">simsforhire.com</p>
            </div>
            <span className="text-2xl text-white/40">→</span>
          </a>

          <a
            href="https://miami.shiftarcade.com/pay"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border-2 p-4 transition-transform active:scale-[0.98]"
            style={{ borderColor: MIAMI_PINK, background: "rgba(255,91,167,0.08)" }}
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
              style={{ background: MIAMI_PINK, color: "#0a0a12" }}
            >
              🏎️
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-extrabold" style={{ color: MIAMI_PINK }}>
                30% Off · Code <span className="font-mono">F1MIA</span>
              </p>
              <p className="text-lg font-extrabold leading-tight">Drive Our Sims</p>
              <p className="text-[11px] text-white/60 truncate">miami.shiftarcade.com</p>
            </div>
            <span className="text-2xl text-white/40">→</span>
          </a>
        </div>

        {/* Instagram */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <div className="flex items-center justify-center gap-2 mb-3 text-white/60">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span className="text-[11px] uppercase tracking-wider font-bold">Follow Us</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://instagram.com/simsforhire"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-center text-[13px] font-bold hover:bg-white/10 transition-colors"
            >
              @simsforhire
            </a>
            <a
              href="https://instagram.com/shiftarcade"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-center text-[13px] font-bold hover:bg-white/10 transition-colors"
            >
              @shiftarcade
            </a>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/40">
          A copy of your signed waiver was emailed to{" "}
          <span className="text-white/70">{email}</span>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[13px] text-red-300">
          {error}
        </div>
      )}

      <WaiverScrollGate
        body={waiverBody}
        onAgreedChange={setAgreed}
        brandColor={MIAMI_PINK}
        agreementLabel="I have read and agree to the waiver above, and consent to receive marketing communications about future events."
      />

      <fieldset className="space-y-3 pt-1">
        <legend className="text-xs uppercase tracking-wider text-white/75 font-semibold mb-1">
          Your Information
        </legend>

        {/* Full name + email side-by-side */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/80">
              Full Name <span style={{ color: MIAMI_PINK }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ caretColor: MIAMI_PINK, fontSize: "16px" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/80">
              Email <span style={{ color: MIAMI_PINK }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2"
              style={{ caretColor: MIAMI_PINK, fontSize: "16px" }}
            />
          </div>
        </div>
        <p className="text-[10px] text-white/40 -mt-1">
          We&apos;ll email your signed waiver here.
        </p>

        {/* Phone — own row, optional */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-medium text-white/80">
            Phone <span className="text-white/40">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2"
            style={{ fontSize: "16px" }}
          />
        </div>

        <label className="flex items-start gap-2 pt-1 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            style={{ accentColor: MIAMI_PINK }}
          />
          <span className="text-[11px] leading-snug text-white/60">
            Send me updates about future Sims For Hire events. (Uncheck to opt out.)
          </span>
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-xs uppercase tracking-wider text-white/75 font-semibold mb-2">
          Signature <span style={{ color: MIAMI_PINK }}>*</span>
        </legend>
        <SignaturePad onChange={setSignature} />
      </fieldset>

      <button
        type="submit"
        disabled={pending || !agreed || !signature || !name.trim() || !email.trim()}
        className="w-full rounded-full py-4 text-base font-black uppercase tracking-wider text-[#0a0a12] disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        style={{
          background: `linear-gradient(135deg, ${MIAMI_PINK} 0%, ${MIAMI_BLUE} 100%)`,
        }}
      >
        {pending ? "Signing…" : "Sign & Submit"}
      </button>

      <p className="text-[10px] text-center text-white/40 leading-relaxed">
        Your e-signature has the same legal force as a handwritten one (Florida E-SIGN Act).
        We capture timestamp, IP, device, and the exact waiver version (v{waiverVersion}).
      </p>
    </form>
  );
}
