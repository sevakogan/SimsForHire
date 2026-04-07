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
   Rich text helper — renders text with bold spans
   ──────────────────────────────────────────────── */

function RichText({ text, bold }: { text: string; bold?: string }) {
  if (!bold) return <>{text}</>;

  const idx = text.indexOf(bold);
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-white">{bold}</strong>
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
}: {
  section: NdaSection;
  contractorName: string;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <h3 className="text-sm font-bold text-white">
        {section.number}. {section.title}
      </h3>
      <div className="mt-2 space-y-2">
        {section.clauses.map((clause) => {
          const clauseText = clause.text
            .replace(/\[Contractor Name\]/g, contractorName)
            .replace(/\[Date\]/g, getTodayFormatted());

          return (
            <div key={clause.id}>
              <p className="text-[13px] leading-relaxed text-zinc-300">
                <span className="font-semibold text-zinc-200">
                  {clause.id}
                </span>{" "}
                <RichText text={clauseText} bold={clause.bold} />
              </p>
              {clause.subItems && (
                <div className="mt-1.5 ml-6 space-y-1">
                  {clause.subItems.map((sub) => {
                    const subText = sub.text
                      .replace(/\[Contractor Name\]/g, contractorName)
                      .replace(/\[Date\]/g, getTodayFormatted());

                    return (
                      <p
                        key={sub.id}
                        className="text-[13px] leading-relaxed text-zinc-400"
                      >
                        <span className="font-medium text-zinc-300">
                          {sub.id})
                        </span>{" "}
                        <RichText text={subText} bold={sub.bold} />
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

  const documentRef = useRef<HTMLDivElement>(null);

  const handleSignatureChange = useCallback((dataUrl: string | null) => {
    setSignature(dataUrl);
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
        // Override dark styles for PDF (white background, dark text)
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

      // Capture as canvas
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      document.body.removeChild(pdfContainer);

      // Generate PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      const imgData = canvas.toDataURL("image/png");
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
          "PNG",
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
    } catch (err) {
      console.error("[NdaSigningPage] Sign error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ─── Success state ─── */
  if (signed) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-900/40">
          <svg
            className="h-7 w-7 text-green-400"
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
        <h2 className="text-lg font-bold text-white">
          NDA Signed Successfully
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Your Non-Disclosure Agreement has been signed and filed.
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          A copy has been sent to SimsForHire.
        </p>
        <p className="mt-6 text-xs text-zinc-500">You may close this page.</p>
      </div>
    );
  }

  /* ─── NDA Document + Signing ─── */
  return (
    <div className="space-y-6">
      {/* NDA Document */}
      <div
        ref={documentRef}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-900 px-5 py-6 sm:px-8 text-center">
          <h2 className="text-xl font-black tracking-wide text-white sm:text-2xl">
            {NDA_HEADER.company}
          </h2>
          <p className="mt-0.5 text-[11px] italic text-zinc-500">
            {NDA_HEADER.division}
          </p>
          <div className="my-4 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-zinc-700" />
            <h1 className="text-lg font-bold tracking-wider text-white sm:text-xl whitespace-nowrap">
              {NDA_HEADER.title}
            </h1>
            <div className="h-px flex-1 bg-zinc-700" />
          </div>
        </div>

        {/* Contractor info grid */}
        <div className="border-b border-zinc-800 px-5 py-4 sm:px-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-zinc-300 shrink-0">
                Contractor:
              </span>
              <span className="text-sm text-zinc-400 truncate">
                {applicantName}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-zinc-300 shrink-0">
                Position:
              </span>
              <span className="text-sm text-zinc-400 truncate">{jobTitle}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-zinc-300 shrink-0">
                Date:
              </span>
              <span className="text-sm text-zinc-400">{today}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-zinc-300 shrink-0">
                Company:
              </span>
              <span className="text-sm text-zinc-400">SimsForHire</span>
            </div>
          </div>
        </div>

        {/* Preamble */}
        <div className="px-5 pt-5 sm:px-8">
          <p className="text-[13px] leading-relaxed text-zinc-300">
            {NDA_HEADER.preamble}
          </p>
        </div>

        {/* Sections */}
        <div className="px-5 pb-6 sm:px-8 mt-2">
          {NDA_SECTIONS.map((section) => (
            <SectionBlock
              key={section.number}
              section={section}
              contractorName={applicantName}
            />
          ))}
        </div>

        {/* Acknowledgment box */}
        <div className="mx-5 mb-6 sm:mx-8 rounded-lg border border-zinc-700 bg-zinc-800/60 px-5 py-4 text-center">
          <p className="text-sm font-bold text-white mb-2">
            BY SIGNING BELOW, CONTRACTOR ACKNOWLEDGES:
          </p>
          {NDA_ACKNOWLEDGMENTS.map((ack) => (
            <p key={ack} className="text-xs font-medium text-zinc-400">
              {ack}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-5 py-3 sm:px-8 text-center">
          <p className="text-[10px] text-zinc-600">{NDA_FOOTER}</p>
        </div>
      </div>

      {/* ─── Signing Area ─── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
        <div className="px-5 py-5 sm:px-8">
          <h3 className="text-sm font-bold text-white mb-4">
            CONTRACTOR SIGNATURE
          </h3>

          {error && (
            <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name + Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="signer-name"
                  className="block text-xs font-medium text-zinc-400 mb-1"
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Date
                </label>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-400">
                  {today}
                </div>
              </div>
            </div>

            {/* Signature pad */}
            <div className="[&_p]:text-zinc-400 [&_button]:text-zinc-500 [&_canvas]:bg-zinc-800 [&_input]:bg-zinc-800 [&_input]:text-white [&_input]:placeholder-zinc-500 [&_.border-dashed]:border-zinc-600">
              <SignaturePad
                onChange={handleSignatureChange}
                label="Contractor Signature"
                placeholder="Sign here with mouse, finger, or stylus"
              />
            </div>

            <p className="text-[10px] text-zinc-500">
              IP address and timestamp will be recorded automatically upon
              signing.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Submit button ─── */}
      <div className="flex flex-col items-center gap-3">
        {!canSubmit && (
          <p className="text-xs text-zinc-500 text-center">
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
          className="w-full max-w-md rounded-xl bg-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
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

        <p className="text-[10px] text-zinc-500 text-center max-w-sm">
          By clicking &quot;Sign NDA&quot; you acknowledge that this is a
          legally binding electronic signature.
        </p>
      </div>
    </div>
  );
}
