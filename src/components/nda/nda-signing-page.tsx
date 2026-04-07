"use client";

import { useState, useCallback, useRef } from "react";
import { SignaturePad } from "@/components/portal/signature-pad";
import {
  NDA_HEADER,
  NDA_SECTIONS,
  NDA_ACKNOWLEDGMENTS,
  NDA_FOOTER,
} from "@/lib/constants/nda-content";
import type { NdaSection } from "@/lib/constants/nda-content";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface NdaSigningPageProps {
  readonly applicantName: string;
  readonly jobTitle: string;
  readonly token: string;
}

/* ────────────────────────────────────────────────
   Theme helpers
   ──────────────────────────────────────────────── */

function themeClasses(isDark: boolean) {
  return {
    card: isDark
      ? "bg-[#1C1C1E] border-zinc-700"
      : "bg-white border-gray-200/60",
    cardInner: isDark ? "border-zinc-700" : "border-gray-200/60",
    heading: isDark ? "text-white" : "text-[#1D1D1F]",
    body: isDark ? "text-zinc-300" : "text-[#6E6E73]",
    clause: isDark ? "text-zinc-300" : "text-[#424245]",
    clauseId: isDark ? "text-zinc-200" : "text-[#1D1D1F]",
    subClause: isDark ? "text-zinc-400" : "text-[#6E6E73]",
    subClauseId: isDark ? "text-zinc-300" : "text-[#424245]",
    bold: isDark ? "text-white" : "text-[#1D1D1F]",
    label: isDark ? "text-zinc-400" : "text-[#86868B]",
    muted: isDark ? "text-zinc-500" : "text-[#86868B]",
    dimmed: isDark ? "text-zinc-600" : "text-[#AEAEB2]",
    input: isDark
      ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
      : "bg-[#F5F5F7] border-gray-200 text-[#1D1D1F] placeholder-[#AEAEB2]",
    inputReadonly: isDark
      ? "bg-zinc-800/50 border-zinc-700 text-zinc-400"
      : "bg-[#F5F5F7] border-gray-200 text-[#86868B]",
    ackBox: isDark
      ? "bg-zinc-800/60 border-zinc-700"
      : "bg-[#F5F5F7] border-gray-200/60",
    headerBar: isDark ? "bg-[#1C1C1E] border-zinc-700" : "bg-[#FAFAFA] border-gray-200/60",
    divider: isDark ? "bg-zinc-700" : "bg-gray-200",
    error: isDark
      ? "bg-red-900/30 border-red-800 text-red-300"
      : "bg-red-50 border-red-200 text-red-600",
    sigPad: isDark
      ? "[&_p]:text-zinc-400 [&_button]:text-zinc-500 [&_canvas]:bg-zinc-800 [&_input]:bg-zinc-800 [&_input]:text-white [&_input]:placeholder-zinc-500 [&_.border-dashed]:border-zinc-600"
      : "[&_p]:text-[#86868B] [&_button]:text-[#86868B] [&_canvas]:bg-white [&_input]:bg-[#F5F5F7] [&_input]:text-[#1D1D1F] [&_input]:placeholder-[#AEAEB2] [&_.border-dashed]:border-gray-300",
    successBg: isDark ? "bg-green-900/40" : "bg-green-50",
    successIcon: isDark ? "text-green-400" : "text-green-500",
    successText: isDark ? "text-zinc-400" : "text-[#86868B]",
  };
}

/* ────────────────────────────────────────────────
   Rich text helper — renders text with bold spans
   ──────────────────────────────────────────────── */

function RichText({
  text,
  bold,
  boldClass,
}: {
  text: string;
  bold?: string;
  boldClass: string;
}) {
  if (!bold) return <>{text}</>;

  const idx = text.indexOf(bold);
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <strong className={`font-semibold ${boldClass}`}>{bold}</strong>
      {text.slice(idx + bold.length)}
    </>
  );
}

/* ────────────────────────────────────────────────
   Section renderer
   ──────────────────────────────────────────────── */

function SectionBlock({
  section,
  contractorName,
  theme,
}: {
  section: NdaSection;
  contractorName: string;
  theme: ReturnType<typeof themeClasses>;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <h3 className={`text-[13px] font-semibold ${theme.heading}`}>
        {section.number}. {section.title}
      </h3>
      <div className="mt-2 space-y-2">
        {section.clauses.map((clause) => {
          const clauseText = clause.text
            .replace(/\[Contractor Name\]/g, contractorName)
            .replace(/\[Date\]/g, getTodayFormatted());

          return (
            <div key={clause.id}>
              <p
                className={`text-[14px] leading-[1.65] ${theme.clause}`}
              >
                <span className={`font-semibold ${theme.clauseId}`}>
                  {clause.id}
                </span>{" "}
                <RichText
                  text={clauseText}
                  bold={clause.bold}
                  boldClass={theme.bold}
                />
              </p>
              {clause.subItems && (
                <div className="mt-1.5 ml-5 space-y-1">
                  {clause.subItems.map((sub) => {
                    const subText = sub.text
                      .replace(/\[Contractor Name\]/g, contractorName)
                      .replace(/\[Date\]/g, getTodayFormatted());

                    return (
                      <p
                        key={sub.id}
                        className={`text-[14px] leading-[1.65] ${theme.subClause}`}
                      >
                        <span
                          className={`font-medium ${theme.subClauseId}`}
                        >
                          {sub.id})
                        </span>{" "}
                        <RichText
                          text={subText}
                          bold={sub.bold}
                          boldClass={theme.bold}
                        />
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Date helper
   ──────────────────────────────────────────────── */

function getTodayFormatted(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ────────────────────────────────────────────────
   Dark mode toggle button
   ──────────────────────────────────────────────── */

function DarkModeToggle({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        isDark
          ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
          : "bg-gray-100 text-[#86868B] hover:bg-gray-200"
      }`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <>
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
          Light
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          Dark
        </>
      )}
    </button>
  );
}

/* ────────────────────────────────────────────────
   PDF signature block builder (safe DOM methods)
   ──────────────────────────────────────────────── */

function buildPdfSignatureBlock(
  name: string,
  date: string,
  signatureDataUrl: string
): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "margin-top:32px;padding-top:24px;border-top:2px solid #e5e7eb;";

  // Title
  const title = document.createElement("div");
  title.style.cssText = "font-weight:700;font-size:14px;margin-bottom:16px;";
  title.textContent = "CONTRACTOR SIGNATURE";
  wrapper.appendChild(title);

  // Grid with name and date
  const grid = document.createElement("div");
  grid.style.cssText =
    "display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;";

  const nameCol = document.createElement("div");
  const nameLabel = document.createElement("div");
  nameLabel.style.cssText = "font-size:11px;color:#6b7280;font-weight:600;";
  nameLabel.textContent = "Full Name";
  const nameValue = document.createElement("div");
  nameValue.style.cssText =
    "font-size:14px;font-weight:500;margin-top:4px;";
  nameValue.textContent = name;
  nameCol.appendChild(nameLabel);
  nameCol.appendChild(nameValue);

  const dateCol = document.createElement("div");
  const dateLabel = document.createElement("div");
  dateLabel.style.cssText = "font-size:11px;color:#6b7280;font-weight:600;";
  dateLabel.textContent = "Date";
  const dateValue = document.createElement("div");
  dateValue.style.cssText =
    "font-size:14px;font-weight:500;margin-top:4px;";
  dateValue.textContent = date;
  dateCol.appendChild(dateLabel);
  dateCol.appendChild(dateValue);

  grid.appendChild(nameCol);
  grid.appendChild(dateCol);
  wrapper.appendChild(grid);

  // Signature image
  const sigSection = document.createElement("div");
  const sigLabel = document.createElement("div");
  sigLabel.style.cssText =
    "font-size:11px;color:#6b7280;font-weight:600;margin-bottom:8px;";
  sigLabel.textContent = "Signature";
  sigSection.appendChild(sigLabel);

  const sigImg = document.createElement("img");
  sigImg.src = signatureDataUrl;
  sigImg.alt = "Signature";
  sigImg.style.cssText = "max-height:80px;object-fit:contain;";
  sigSection.appendChild(sigImg);
  wrapper.appendChild(sigSection);

  // Footer
  const footer = document.createElement("div");
  footer.style.cssText =
    "margin-top:24px;text-align:center;font-size:10px;color:#9ca3af;";
  footer.textContent = NDA_FOOTER;
  wrapper.appendChild(footer);

  return wrapper;
}

/* ────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────── */

export function NdaSigningPage({
  applicantName,
  jobTitle,
  token,
}: NdaSigningPageProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [signerName, setSignerName] = useState(applicantName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);
  const theme = themeClasses(isDark);

  const handleSignatureChange = useCallback((dataUrl: string | null) => {
    setSignature(dataUrl);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const today = getTodayFormatted();

  const canSubmit =
    signerName.trim().length > 0 && signature !== null && !loading;

  async function handleSign() {
    if (!canSubmit || !signature) return;
    setLoading(true);
    setError(null);

    try {
      // Dynamic imports for client-only libs
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      // Build a hidden div with full NDA + signature for PDF capture
      const pdfContainer = document.createElement("div");
      pdfContainer.style.cssText =
        "position:absolute;left:-9999px;top:0;width:800px;background:#fff;color:#111;font-family:system-ui,-apple-system,sans-serif;padding:40px;";

      // Clone the document content
      if (documentRef.current) {
        const clone = documentRef.current.cloneNode(true) as HTMLElement;
        // Override styles for PDF (white background, dark text)
        clone.style.cssText = "color:#111;background:#fff;";
        clone.querySelectorAll("*").forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.color = "#111";
        });
        pdfContainer.appendChild(clone);
      }

      // Add signature block using safe DOM methods
      const sigBlock = buildPdfSignatureBlock(
        signerName.trim(),
        today,
        signature
      );
      pdfContainer.appendChild(sigBlock);

      document.body.appendChild(pdfContainer);

      // Capture as canvas (scale 1 to keep payload small for Vercel)
      const canvas = await html2canvas(pdfContainer, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      document.body.removeChild(pdfContainer);

      // Generate PDF with JPEG compression
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      const imgData = canvas.toDataURL("image/jpeg", 0.75);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let yOffset = 0;
      let isFirstPage = true;

      while (remainingHeight > 0) {
        const pageContentHeight = pdfHeight - margin * 2;

        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;

        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          margin - yOffset,
          imgWidth,
          imgHeight
        );

        yOffset += pageContentHeight;
        remainingHeight -= pageContentHeight;
      }

      // Convert to base64
      const pdfBase64 = pdf.output("datauristring").split(",")[1];

      // POST to API
      const response = await fetch(`/api/nda/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureName: signerName.trim(),
          signatureDataUrl: signature,
          pdfBase64,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to sign NDA. Please try again.");
      } else {
        setSigned(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[NdaSigningPage] Sign error:", msg);
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  /* ─── Success state ─── */
  if (signed) {
    return (
      <div
        className={`rounded-2xl border shadow-sm p-8 text-center ${theme.card}`}
      >
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${theme.successBg}`}
        >
          <svg
            className={`h-7 w-7 ${theme.successIcon}`}
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
        <h2 className={`text-lg font-bold ${theme.heading}`}>
          NDA Signed Successfully
        </h2>
        <p className={`mt-2 text-sm ${theme.successText}`}>
          Your Non-Disclosure Agreement has been signed and filed.
        </p>
        <p className={`mt-1 text-sm ${theme.successText}`}>
          A copy has been sent to SimsForHire.
        </p>
        <p className={`mt-6 text-xs ${theme.muted}`}>
          You may close this page.
        </p>
      </div>
    );
  }

  /* ─── NDA Document + Signing ─── */
  return (
    <div className="space-y-6">
      {/* NDA Document */}
      <div
        ref={documentRef}
        className={`rounded-2xl border shadow-sm overflow-hidden ${theme.card}`}
      >
        {/* Header with dark mode toggle */}
        <div
          className={`border-b px-4 py-6 sm:px-8 ${theme.headerBar} ${theme.cardInner}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 text-center">
              <h2
                className={`text-xl font-black tracking-wide sm:text-2xl ${theme.heading}`}
              >
                {NDA_HEADER.company}
              </h2>
              <p className={`mt-0.5 text-[11px] italic ${theme.muted}`}>
                {NDA_HEADER.division}
              </p>
            </div>
            <DarkModeToggle isDark={isDark} onToggle={toggleDark} />
          </div>
          <div className="my-4 flex items-center justify-center gap-3">
            <div className={`h-px flex-1 ${theme.divider}`} />
            <h1
              className={`text-lg font-bold tracking-wider sm:text-xl whitespace-nowrap ${theme.heading}`}
            >
              {NDA_HEADER.title}
            </h1>
            <div className={`h-px flex-1 ${theme.divider}`} />
          </div>
        </div>

        {/* Contractor info grid */}
        <div className={`border-b px-4 py-4 sm:px-8 ${theme.cardInner}`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xs font-bold shrink-0 ${theme.heading}`}
              >
                Contractor:
              </span>
              <span className={`text-sm truncate ${theme.body}`}>
                {applicantName}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xs font-bold shrink-0 ${theme.heading}`}
              >
                Position:
              </span>
              <span className={`text-sm truncate ${theme.body}`}>
                {jobTitle}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xs font-bold shrink-0 ${theme.heading}`}
              >
                Date:
              </span>
              <span className={`text-sm ${theme.body}`}>{today}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xs font-bold shrink-0 ${theme.heading}`}
              >
                Company:
              </span>
              <span className={`text-sm ${theme.body}`}>SimsForHire</span>
            </div>
          </div>
        </div>

        {/* Preamble */}
        <div className="px-4 pt-5 sm:px-8">
          <p className={`text-[15px] leading-[1.7] ${theme.body}`}>
            {NDA_HEADER.preamble}
          </p>
        </div>

        {/* Sections */}
        <div className="px-4 pb-6 sm:px-8 md:px-8 mt-2 space-y-5">
          {NDA_SECTIONS.map((section) => (
            <SectionBlock
              key={section.number}
              section={section}
              contractorName={applicantName}
              theme={theme}
            />
          ))}
        </div>

        {/* Acknowledgment box */}
        <div
          className={`mx-4 mb-6 sm:mx-8 rounded-xl border px-5 py-4 text-center ${theme.ackBox}`}
        >
          <p className={`text-sm font-bold mb-2 ${theme.heading}`}>
            BY SIGNING BELOW, CONTRACTOR ACKNOWLEDGES:
          </p>
          {NDA_ACKNOWLEDGMENTS.map((ack) => (
            <p key={ack} className={`text-xs font-medium ${theme.label}`}>
              {ack}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div
          className={`border-t px-4 py-3 sm:px-8 text-center ${theme.cardInner}`}
        >
          <p className={`text-[10px] ${theme.dimmed}`}>{NDA_FOOTER}</p>
        </div>
      </div>

      {/* ─── Signing Area ─── */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${theme.card}`}
      >
        <div className="px-4 py-5 sm:px-8">
          <h3 className={`text-[13px] font-semibold mb-4 ${theme.heading}`}>
            CONTRACTOR SIGNATURE
          </h3>

          {error && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${theme.error}`}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name + Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="signer-name"
                  className={`block text-xs font-medium mb-1 ${theme.label}`}
                >
                  Full Name
                </label>
                <input
                  id="signer-name"
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Full legal name"
                  disabled={loading}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:border-[#E10600] focus:outline-none focus:ring-2 focus:ring-[#E10600]/20 disabled:opacity-50 ${theme.input}`}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${theme.label}`}
                >
                  Date
                </label>
                <div
                  className={`rounded-xl border px-3 py-2.5 text-sm ${theme.inputReadonly}`}
                >
                  {today}
                </div>
              </div>
            </div>

            {/* Signature pad */}
            <div className={theme.sigPad}>
              <SignaturePad
                onChange={handleSignatureChange}
                label="Contractor Signature"
                placeholder="Sign here with mouse, finger, or stylus"
              />
            </div>

            <p className={`text-[10px] ${theme.muted}`}>
              IP address and timestamp will be recorded automatically upon
              signing.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Submit button ─── */}
      <div className="flex flex-col items-center gap-3">
        {!canSubmit && (
          <p className={`text-xs text-center ${theme.muted}`}>
            {!signerName.trim()
              ? "Enter your full name above"
              : !signature
                ? "Add your signature above"
                : ""}
          </p>
        )}

        <button
          type="button"
          onClick={handleSign}
          disabled={!canSubmit}
          className="w-full max-w-md rounded-xl bg-[#E10600] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#C00500] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Signing NDA...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                />
              </svg>
              Sign NDA
            </span>
          )}
        </button>

        <p className={`text-[10px] text-center max-w-sm ${theme.muted}`}>
          By clicking &quot;Sign NDA&quot; you acknowledge that this is a
          legally binding electronic signature.
        </p>
      </div>
    </div>
  );
}
