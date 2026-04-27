"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import WaiverScrollGate from "@/components/waiver/WaiverScrollGate";
import { SignaturePad } from "@/components/waiver/SignaturePad";
import { recordWaiverSignature } from "@/lib/actions/waiver-events";
import { pickF1Quote } from "@/lib/f1-quotes";

/** Instagram brand gradient logo (no extra font deps). */
function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-bg" cx="0.3" cy="1" r="1">
          <stop offset="0%" stopColor="#FED576" />
          <stop offset="25%" stopColor="#F47133" />
          <stop offset="50%" stopColor="#BC3081" />
          <stop offset="75%" stopColor="#4C63D2" />
          <stop offset="100%" stopColor="#5851DB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-bg)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="white" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="white" />
    </svg>
  );
}

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

  // When the success view replaces the form, the user is usually scrolled
  // near the bottom (signature pad + submit). Snap to top so the
  // SHOW-TO-ATTENDANT card is fully visible immediately.
  useEffect(() => {
    if (!success) return;
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [success]);

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
      <div className="space-y-5 overflow-x-hidden" style={{ touchAction: "pan-y" }}>
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
            className="text-base font-extrabold uppercase tracking-[0.3em] mb-3"
            style={{ color: MIAMI_BLUE }}
          >
            Show This to Attendant
          </p>

          <h2 className="text-5xl font-black tracking-tight leading-none break-words">
            {success.name}
          </h2>

          <p className="mt-4 text-lg font-semibold text-white/85">Waiver signed ✓</p>
          <p className="mt-1 text-base text-white/60">{success.signedAt}</p>

          <div
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm uppercase tracking-wider font-extrabold"
            style={{ background: MIAMI_BLUE, color: "#0a0a12" }}
          >
            <span className="h-2 w-2 rounded-full bg-[#0a0a12]" />
            Verified · v{waiverVersion}
          </div>

          {/* Screenshot prompt */}
          <div
            className="mt-5 rounded-2xl px-4 py-3.5 text-center font-extrabold"
            style={{
              background: "rgba(0,0,0,0.45)",
              border: `2px dashed ${MIAMI_BLUE}`,
            }}
          >
            <p className="text-lg leading-tight flex items-center justify-center gap-2 flex-wrap">
              <span className="text-2xl">📸</span>
              <span>Screenshot This — Show Attendant</span>
            </p>
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
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-black p-1.5"
            >
              <Image
                src="/sims-logo-white.png"
                alt="Sims For Hire"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
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
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-black p-1.5"
            >
              <Image
                src="/shift-confirmation.png"
                alt="Shift Arcade Miami"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
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
          <div className="flex items-center justify-center gap-2 mb-3 text-white/70">
            <InstagramIcon className="h-5 w-5" />
            <span className="text-[11px] uppercase tracking-wider font-bold">Follow Us</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://instagram.com/simsforhire"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-2 py-2.5 text-[13px] font-bold hover:bg-white/10 transition-colors min-w-0"
            >
              <InstagramIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">@simsforhire</span>
            </a>
            <a
              href="https://www.instagram.com/shiftarcade.miami/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-2 py-2.5 text-[13px] font-bold hover:bg-white/10 transition-colors min-w-0"
            >
              <InstagramIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">@shiftarcade.miami</span>
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
      className="space-y-5 rounded-2xl border-2 p-5 shadow-2xl"
      style={{
        background: "#11091c",
        borderColor: "rgba(255, 91, 167, 0.45)",
        boxShadow:
          "0 0 0 1px rgba(123, 208, 245, 0.15), 0 25px 60px -10px rgba(0,0,0,0.6)",
      }}
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
        <legend className="text-xs uppercase tracking-wider text-white font-bold mb-1">
          Your Information
        </legend>

        {/* Full name + email side-by-side */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-white/95">
              Full Name <span style={{ color: MIAMI_PINK }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-lg border-2 border-black bg-[#0a0510] px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ caretColor: MIAMI_PINK, fontSize: "16px" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-white/95">
              Email <span style={{ color: MIAMI_PINK }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border-2 border-black bg-[#0a0510] px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2"
              style={{ caretColor: MIAMI_PINK, fontSize: "16px" }}
            />
          </div>
        </div>
        <p className="text-[10px] text-white/40 -mt-1">
          We&apos;ll email your signed waiver here.
        </p>

        {/* Phone — own row, optional */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[12px] font-semibold text-white/95">
            Phone <span className="text-white/40">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="w-full rounded-lg border-2 border-black bg-[#0a0510] px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2"
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
        <legend className="text-xs uppercase tracking-wider text-white font-bold mb-2">
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
