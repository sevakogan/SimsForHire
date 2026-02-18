"use client";

import { useState, useRef } from "react";
import { useFulfillmentType } from "./invoice-section";

interface EditableCustomerCardProps {
  clientId: string;
  projectId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  shippingAddress: string;
  readOnly?: boolean;
}

export function EditableCustomerCard({
  clientId,
  projectId,
  name,
  email,
  phone,
  address,
  shippingAddress,
  readOnly = false,
}: EditableCustomerCardProps) {
  const fulfillmentType = useFulfillmentType();

  // Client fields
  const [localName, setLocalName] = useState(name);
  const [localEmail, setLocalEmail] = useState(email ?? "");
  const [localPhone, setLocalPhone] = useState(phone ?? "");
  const [localAddress, setLocalAddress] = useState(address ?? "");

  // Shipping/delivery address (on project, not client)
  const [localShipping, setLocalShipping] = useState(shippingAddress);

  // Refs for blur handlers
  const nameRef = useRef(localName);
  nameRef.current = localName;
  const emailRef = useRef(localEmail);
  emailRef.current = localEmail;
  const phoneRef = useRef(localPhone);
  phoneRef.current = localPhone;
  const addressRef = useRef(localAddress);
  addressRef.current = localAddress;
  const shippingRef = useRef(localShipping);
  shippingRef.current = localShipping;

  /* ── Persist helpers ─────────────────────────────────── */

  function persistClient(field: string, value: string | null) {
    fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch((err) => {
      console.error(`[EditableCustomerCard] client save error (${field}):`, err);
    });
  }

  function persistProject(field: string, value: string | null) {
    fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch((err) => {
      console.error(`[EditableCustomerCard] project save error (${field}):`, err);
    });
  }

  /* ── Blur handlers ───────────────────────────────────── */

  function handleNameBlur() {
    const trimmed = nameRef.current.trim();
    setLocalName(trimmed);
    if (trimmed) persistClient("name", trimmed);
  }

  function handleEmailBlur() {
    const trimmed = emailRef.current.trim();
    setLocalEmail(trimmed);
    persistClient("email", trimmed || null);
  }

  function handlePhoneBlur() {
    const trimmed = phoneRef.current.trim();
    setLocalPhone(trimmed);
    persistClient("phone", trimmed || null);
  }

  function handleAddressBlur() {
    const trimmed = addressRef.current.trim();
    setLocalAddress(trimmed);
    persistClient("address", trimmed || null);
  }

  function handleShippingBlur() {
    const trimmed = shippingRef.current.trim();
    setLocalShipping(trimmed);
    persistProject("shipping_address", trimmed || null);
  }

  /* ── Show shipping/delivery section? ─────────────────── */

  const showShipping = fulfillmentType === "delivery" || fulfillmentType === "white_glove";
  const shippingLabel = fulfillmentType === "white_glove" ? "Delivery Address" : "Shipping Address";

  const inputBase =
    "w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-xs text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-all";

  const readOnlyClass = readOnly ? "opacity-60 cursor-not-allowed" : "";

  return (
    <div className="h-full rounded-2xl border border-gray-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 shadow-sm overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Client avatar + editable name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
            <span className="text-sm font-bold text-white">
              {(localName || "C").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            {readOnly ? (
              <h3 className="text-sm font-bold text-gray-900 truncate">
                {localName}
              </h3>
            ) : (
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                placeholder="Client name"
                className={`${inputBase} !py-1 text-sm font-bold ${readOnlyClass}`}
                disabled={readOnly}
              />
            )}
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mt-0.5">
              Customer
            </p>
          </div>
        </div>

        {/* Editable contact fields */}
        <div className="space-y-2.5">
          {/* Email */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            {readOnly ? (
              <span className="text-xs text-gray-600 truncate">{localEmail || <span className="text-gray-400 italic">No email</span>}</span>
            ) : (
              <input
                type="email"
                value={localEmail}
                onChange={(e) => setLocalEmail(e.target.value)}
                onBlur={handleEmailBlur}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                placeholder="Email address"
                className={`${inputBase} flex-1 ${readOnlyClass}`}
                disabled={readOnly}
              />
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-50">
              <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </div>
            {readOnly ? (
              <span className="text-xs text-gray-600">{localPhone || <span className="text-gray-400 italic">No phone</span>}</span>
            ) : (
              <input
                type="tel"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                onBlur={handlePhoneBlur}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                placeholder="Phone number"
                className={`${inputBase} flex-1 ${readOnlyClass}`}
                disabled={readOnly}
              />
            )}
          </div>

          {/* Address (billing) */}
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 mt-0.5">
              <svg className="h-3.5 w-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            {readOnly ? (
              <span className="text-xs text-gray-600 leading-relaxed">{localAddress || <span className="text-gray-400 italic">No address</span>}</span>
            ) : (
              <textarea
                value={localAddress}
                onChange={(e) => setLocalAddress(e.target.value)}
                onBlur={handleAddressBlur}
                placeholder="Billing address"
                rows={2}
                className={`${inputBase} flex-1 resize-y leading-relaxed ${readOnlyClass}`}
                disabled={readOnly}
              />
            )}
          </div>
        </div>

        {/* Shipping / Delivery Address — only for delivery or white_glove */}
        {showShipping && (
          <>
            <div className="border-t border-gray-200/60" />

            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 mt-0.5">
                <svg
                  className="h-3.5 w-3.5 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-500 mb-1">
                  {shippingLabel}
                </p>
                {readOnly ? (
                  <span className="text-xs text-gray-600 leading-relaxed">
                    {localShipping || <span className="text-gray-400 italic">No address</span>}
                  </span>
                ) : (
                  <textarea
                    value={localShipping}
                    onChange={(e) => setLocalShipping(e.target.value)}
                    onBlur={handleShippingBlur}
                    placeholder={`Enter ${shippingLabel.toLowerCase()}...`}
                    rows={2}
                    className={`w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-xs text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/20 resize-y transition-all leading-relaxed ${readOnlyClass}`}
                    disabled={readOnly}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
