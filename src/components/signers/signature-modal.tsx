"use client";

import { useEffect } from "react";

export interface SignatureModalSigner {
  name: string;
  email: string | null;
  phone: string | null;
  event_name?: string;
  marketing_opt_in?: boolean;
  waiver_version: number | null;
  waiver_accepted_at: string | null;
  waiver_accepted_ip: string | null;
  waiver_accepted_user_agent?: string | null;
  signature_data_url: string | null;
}

interface Props {
  signer: SignatureModalSigner | null;
  onClose: () => void;
}

export function SignatureModal({ signer, onClose }: Props) {
  useEffect(() => {
    if (!signer) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [signer, onClose]);

  if (!signer) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/40 px-5 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              Signature
            </p>
            <h2 className="text-lg font-semibold text-foreground">{signer.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Signature image */}
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Drawn Signature
            </p>
            {signer.signature_data_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signer.signature_data_url}
                alt={`${signer.name} signature`}
                className="w-full rounded-lg border-2 border-dashed border-border bg-white p-2"
              />
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-[12px] text-muted-foreground">
                No drawn signature on file
              </div>
            )}
          </div>

          {/* Info grid */}
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Email
              </dt>
              <dd className="mt-0.5 text-foreground break-all">
                {signer.email ? (
                  <a className="hover:underline" href={`mailto:${signer.email}`}>
                    {signer.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Phone
              </dt>
              <dd className="mt-0.5 text-foreground">{signer.phone || "—"}</dd>
            </div>
            {signer.event_name && (
              <div className="sm:col-span-2">
                <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Event
                </dt>
                <dd className="mt-0.5 text-foreground">{signer.event_name}</dd>
              </div>
            )}
            <div>
              <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Signed
              </dt>
              <dd className="mt-0.5 text-foreground">
                {signer.waiver_accepted_at
                  ? new Date(signer.waiver_accepted_at).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Waiver Version
              </dt>
              <dd className="mt-0.5 text-foreground">
                v{signer.waiver_version ?? "?"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                IP Address
              </dt>
              <dd className="mt-0.5 font-mono text-[12px] text-foreground">
                {signer.waiver_accepted_ip ?? "—"}
              </dd>
            </div>
            {signer.marketing_opt_in !== undefined && (
              <div>
                <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Marketing
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {signer.marketing_opt_in ? "✓ Opted in" : "Opted out"}
                </dd>
              </div>
            )}
            {signer.waiver_accepted_user_agent && (
              <div className="sm:col-span-2">
                <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Device
                </dt>
                <dd className="mt-0.5 text-[11px] text-muted-foreground break-all">
                  {signer.waiver_accepted_user_agent}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
