"use client";

import { useState, useRef } from "react";
import { updateClientAddressByPortalUser } from "@/lib/actions/clients";
import { updateShippingAddressByPortalUser } from "@/lib/actions/projects";

interface PortalAddressEditorProps {
  clientId: string;
  shareToken: string;
  clientAddress: string | null;
  shippingAddress: string | null;
  contractSigned: boolean;
}

export function PortalAddressEditor({
  clientId,
  shareToken,
  clientAddress,
  shippingAddress,
  contractSigned,
}: PortalAddressEditorProps) {
  const [localClientAddr, setLocalClientAddr] = useState(clientAddress ?? "");
  const [localShippingAddr, setLocalShippingAddr] = useState(shippingAddress ?? "");
  const [savingClient, setSavingClient] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [clientSaved, setClientSaved] = useState(false);
  const [shippingSaved, setShippingSaved] = useState(false);

  const clientRef = useRef(localClientAddr);
  clientRef.current = localClientAddr;
  const shippingRef = useRef(localShippingAddr);
  shippingRef.current = localShippingAddr;

  async function handleClientBlur() {
    const trimmed = clientRef.current.trim();
    setLocalClientAddr(trimmed);
    if (trimmed === (clientAddress ?? "")) return;

    setSavingClient(true);
    const { error } = await updateClientAddressByPortalUser(clientId, trimmed || null);
    setSavingClient(false);
    if (!error) {
      setClientSaved(true);
      setTimeout(() => setClientSaved(false), 2000);
    }
  }

  async function handleShippingBlur() {
    if (contractSigned) return;
    const trimmed = shippingRef.current.trim();
    setLocalShippingAddr(trimmed);
    if (trimmed === (shippingAddress ?? "")) return;

    setSavingShipping(true);
    const { error } = await updateShippingAddressByPortalUser(shareToken, trimmed || null);
    setSavingShipping(false);
    if (!error) {
      setShippingSaved(true);
      setTimeout(() => setShippingSaved(false), 2000);
    }
  }

  const inputBase =
    "w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y transition-all";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Client address */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <label className="text-xs font-semibold text-gray-700">
              Your Address
            </label>
            {savingClient && (
              <span className="text-[10px] text-gray-400">Saving...</span>
            )}
            {clientSaved && (
              <span className="text-[10px] text-green-500">Saved</span>
            )}
          </div>
          <textarea
            value={localClientAddr}
            onChange={(e) => setLocalClientAddr(e.target.value)}
            onBlur={handleClientBlur}
            placeholder="Enter your address..."
            rows={2}
            className={inputBase}
          />
        </div>

        {/* Shipping / delivery address */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <label className="text-xs font-semibold text-gray-700">
              Delivery Address
            </label>
            {savingShipping && (
              <span className="text-[10px] text-gray-400">Saving...</span>
            )}
            {shippingSaved && (
              <span className="text-[10px] text-green-500">Saved</span>
            )}
            {contractSigned && (
              <span className="text-[10px] text-amber-500">Locked</span>
            )}
          </div>
          <textarea
            value={localShippingAddr}
            onChange={(e) => setLocalShippingAddr(e.target.value)}
            onBlur={handleShippingBlur}
            placeholder="Enter delivery address..."
            rows={2}
            disabled={contractSigned}
            className={`${inputBase} ${contractSigned ? "opacity-60 cursor-not-allowed" : ""}`}
          />
        </div>
      </div>
    </div>
  );
}
