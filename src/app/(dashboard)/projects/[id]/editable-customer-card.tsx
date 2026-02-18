"use client";

import { useState, useRef, useEffect } from "react";
import { useFulfillmentType } from "./invoice-section";

/* ── Reusable click-to-edit field ──────────────────────── */

interface ClickToEditProps {
  value: string;
  placeholder: string;
  onSave: (value: string) => void;
  readOnly?: boolean;
  type?: "text" | "email" | "tel";
  multiline?: boolean;
}

function ClickToEdit({
  value,
  placeholder,
  onSave,
  readOnly = false,
  type = "text",
  multiline = false,
}: ClickToEditProps) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync if parent value changes
  useEffect(() => {
    if (!editing) setLocal(value);
  }, [value, editing]);

  // Auto-focus + select on edit
  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        if (inputRef.current instanceof HTMLInputElement) {
          inputRef.current.select();
        }
      });
    }
  }, [editing]);

  function handleSave() {
    const trimmed = local.trim();
    setLocal(trimmed);
    onSave(trimmed);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setLocal(value);
      setEditing(false);
    }
  }

  if (readOnly || !editing) {
    return (
      <button
        type="button"
        onClick={() => !readOnly && setEditing(true)}
        disabled={readOnly}
        className={`group flex items-center gap-1 min-w-0 text-left w-full ${
          readOnly ? "cursor-default" : "cursor-pointer"
        }`}
        title={readOnly ? undefined : "Click to edit"}
      >
        <span className={`text-xs leading-relaxed truncate transition-colors ${
          local
            ? `text-gray-600 ${!readOnly ? "group-hover:text-gray-900" : ""}`
            : "text-gray-400 italic"
        }`}>
          {local || placeholder}
        </span>
        {!readOnly && (
          <svg
            className="h-3 w-3 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>
        )}
      </button>
    );
  }

  const inputClass =
    "w-full text-xs text-gray-900 bg-transparent border-b-2 border-indigo-400/40 outline-none py-0 px-0 transition-colors focus:border-indigo-500 leading-relaxed";

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        className={`${inputClass} resize-y`}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

/* ── Main card ─────────────────────────────────────────── */

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

  const [localName, setLocalName] = useState(name);
  const [localEmail, setLocalEmail] = useState(email ?? "");
  const [localPhone, setLocalPhone] = useState(phone ?? "");
  const [localAddress, setLocalAddress] = useState(address ?? "");
  const [localShipping, setLocalShipping] = useState(shippingAddress);

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

  /* ── Save handlers ───────────────────────────────────── */

  function saveName(val: string) {
    setLocalName(val);
    if (val) persistClient("name", val);
  }

  function saveEmail(val: string) {
    setLocalEmail(val);
    persistClient("email", val || null);
  }

  function savePhone(val: string) {
    setLocalPhone(val);
    persistClient("phone", val || null);
  }

  function saveAddress(val: string) {
    setLocalAddress(val);
    persistClient("address", val || null);
  }

  function saveShipping(val: string) {
    setLocalShipping(val);
    persistProject("shipping_address", val || null);
  }

  /* ── Show shipping/delivery section? ─────────────────── */

  const showShipping = fulfillmentType === "delivery" || fulfillmentType === "white_glove";
  const shippingLabel = fulfillmentType === "white_glove" ? "Delivery Address" : "Shipping Address";

  return (
    <div className="h-full rounded-2xl border border-gray-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 shadow-sm overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Client avatar + click-to-edit name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
            <span className="text-sm font-bold text-white">
              {(localName || "C").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <ClickToEditName
              value={localName}
              onSave={saveName}
              readOnly={readOnly}
            />
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mt-0.5">
              Customer
            </p>
          </div>
        </div>

        {/* Contact fields — all click-to-edit */}
        <div className="space-y-2.5">
          {/* Email */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <ClickToEdit
                value={localEmail}
                placeholder="Add email"
                onSave={saveEmail}
                readOnly={readOnly}
                type="email"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-50">
              <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <ClickToEdit
                value={localPhone}
                placeholder="Add phone"
                onSave={savePhone}
                readOnly={readOnly}
                type="tel"
              />
            </div>
          </div>

          {/* Address (billing) */}
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 mt-0.5">
              <svg className="h-3.5 w-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <ClickToEdit
                value={localAddress}
                placeholder="Add address"
                onSave={saveAddress}
                readOnly={readOnly}
                multiline
              />
            </div>
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
                <ClickToEdit
                  value={localShipping}
                  placeholder={`Add ${shippingLabel.toLowerCase()}`}
                  onSave={saveShipping}
                  readOnly={readOnly}
                  multiline
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Click-to-edit for the name (bold, larger text) ────── */

function ClickToEditName({
  value,
  onSave,
  readOnly,
}: {
  value: string;
  onSave: (v: string) => void;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setLocal(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.select();
      });
    }
  }, [editing]);

  function handleSave() {
    const trimmed = local.trim();
    if (trimmed) onSave(trimmed);
    else setLocal(value);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setLocal(value);
      setEditing(false);
    }
  }

  if (readOnly || !editing) {
    return (
      <button
        type="button"
        onClick={() => !readOnly && setEditing(true)}
        disabled={readOnly}
        className={`group flex items-center gap-1.5 min-w-0 w-full text-left ${
          readOnly ? "cursor-default" : "cursor-pointer"
        }`}
        title={readOnly ? undefined : "Click to edit"}
      >
        <h3 className={`text-sm font-bold text-gray-900 truncate transition-colors ${
          !readOnly ? "group-hover:text-indigo-600" : ""
        }`}>
          {local}
        </h3>
        {!readOnly && (
          <svg
            className="h-3 w-3 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      placeholder="Client name"
      className="w-full text-sm font-bold text-gray-900 bg-transparent border-b-2 border-indigo-400/40 outline-none py-0 px-0 transition-colors focus:border-indigo-500"
    />
  );
}
