"use client";

/**
 * WaiverScrollGate — scroll-to-bottom + agreement checkbox.
 *
 * Drop into any signup/registration form to enforce that the user actually
 * scrolls through the waiver before they can check the agreement box. The
 * checkbox stays disabled until either:
 *   (a) the user scrolls to the bottom, OR
 *   (b) the waiver fits in the viewport without needing to scroll.
 *
 * Usage:
 *   const [agreed, setAgreed] = useState(false);
 *
 *   <WaiverScrollGate
 *     body={waiverBody}
 *     onAgreedChange={setAgreed}
 *     brandColor="#d92626"
 *   />
 *
 *   <button disabled={!agreed}>Submit</button>
 *
 * The parent passes whatever waiver text it loaded from
 *   `waiver_versions.body where version = (active version)`.
 *
 * After successful submission the parent should pass `waiver_version` and
 * `new Date().toISOString()` to the server action so the audit columns get
 * filled correctly.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  /** The waiver text to display. Whitespace is preserved (`whitespace-pre-wrap`). */
  readonly body: string;
  /** Called whenever the agreement checkbox changes. */
  readonly onAgreedChange: (agreed: boolean) => void;
  /** Optional accent color for the checkbox + scroll-to-bottom button. */
  readonly brandColor?: string;
  /** Optional label override for the agreement checkbox. */
  readonly agreementLabel?: string;
  /** Optional label override for the section heading. */
  readonly heading?: string;
};

export default function WaiverScrollGate({
  body,
  onAgreedChange,
  brandColor = "#d92626",
  agreementLabel = "I have read and agree to the agreement above, including the release of liability and likeness release.",
  heading = "Participant Waiver — Read & Agree",
}: Props) {
  const waiverRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Bubble agreement state up
  useEffect(() => {
    onAgreedChange(agreed);
  }, [agreed, onAgreedChange]);

  // If the waiver fits without scroll, treat it as already-scrolled.
  // Defer to rAF so the state update doesn't cascade synchronously.
  useEffect(() => {
    const el = waiverRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      if (el.scrollHeight <= el.clientHeight + 4) {
        setScrolledToBottom(true);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [body]);

  const handleScroll = useCallback(() => {
    const el = waiverRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 16) {
      setScrolledToBottom(true);
    }
  }, []);

  function scrollToBottom() {
    const el = waiverRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  return (
    <section>
      <p className="text-xs tracking-wider uppercase text-gray-600 dark:text-white mb-2 font-bold">
        {heading}
      </p>

      <div className="relative bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/20 rounded-xl overflow-hidden">
        <div
          ref={waiverRef}
          onScroll={handleScroll}
          className="h-56 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 text-[11px] leading-[1.55] text-gray-700 dark:text-white/85 whitespace-pre-wrap break-words"
          style={{ touchAction: "pan-y", wordBreak: "break-word" }}
        >
          {body}
        </div>
        {/* Fade overlay at bottom while there's still text below */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-black to-transparent transition-opacity duration-300"
          style={{ opacity: scrolledToBottom ? 0 : 1 }}
        />
      </div>

      {!scrolledToBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="mt-3 w-full py-3 rounded-full bg-gray-900 dark:bg-white/85 hover:bg-black dark:hover:bg-white text-white dark:text-black text-sm font-bold tracking-wider uppercase transition-colors"
        >
          ▼ Scroll to Bottom
        </button>
      )}

      <label
        className={`flex items-start gap-3 mt-3 select-none ${
          scrolledToBottom ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
        }`}
      >
        <input
          type="checkbox"
          disabled={!scrolledToBottom}
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 w-5 h-5 flex-shrink-0"
          style={{ accentColor: brandColor }}
        />
        <span className="text-sm leading-snug text-gray-900 dark:text-white/95">
          {agreementLabel}
        </span>
      </label>
    </section>
  );
}
