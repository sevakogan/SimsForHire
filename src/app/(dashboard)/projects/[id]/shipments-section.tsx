"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createShipment,
  updateShipment,
  deleteShipment,
} from "@/lib/actions/shipments";
import { Badge } from "@/components/ui/badge";
import { buttonStyles, formStyles, cardStyles } from "@/components/ui/form-styles";
import { CARRIER_OPTIONS } from "@/lib/constants/carrier-options";
import type { Shipment, ShipmentStatus } from "@/types";

interface ShipmentsSectionProps {
  projectId: string;
  shipments: Shipment[];
}

const STATUS_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  { value: "label_created", label: "Label Created" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
];

const STATUS_LABELS: Record<string, string> = {
  label_created: "Label Created",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export function ShipmentsSection({
  projectId,
  shipments: initialShipments,
}: ShipmentsSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [carrierSelection, setCarrierSelection] = useState("");
  const [carrierCustom, setCarrierCustom] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState<ShipmentStatus>("in_transit");
  const [notes, setNotes] = useState("");

  const carrierName =
    carrierSelection === "Other" ? carrierCustom : carrierSelection;

  function resetForm() {
    setCarrierSelection("");
    setCarrierCustom("");
    setTrackingUrl("");
    setTrackingNumber("");
    setStatus("in_transit");
    setNotes("");
    setError(null);
    setEditingId(null);
  }

  function startEdit(shipment: Shipment) {
    const knownCarrier = CARRIER_OPTIONS.find(
      (o) => o.value !== "Other" && o.value === shipment.carrier_name
    );
    if (knownCarrier) {
      setCarrierSelection(knownCarrier.value);
      setCarrierCustom("");
    } else {
      setCarrierSelection("Other");
      setCarrierCustom(shipment.carrier_name);
    }
    setTrackingUrl(shipment.tracking_url);
    setTrackingNumber(shipment.tracking_number);
    setStatus(shipment.status);
    setNotes(shipment.notes);
    setEditingId(shipment.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (editingId) {
      const result = await updateShipment(editingId, {
        carrierName,
        trackingUrl,
        trackingNumber,
        status,
        notes,
      });
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        resetForm();
        setShowForm(false);
        router.refresh();
      }
    } else {
      const result = await createShipment({
        projectId,
        carrierName,
        trackingUrl,
        trackingNumber,
        status,
        notes,
      });
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        resetForm();
        setShowForm(false);
        router.refresh();
      }
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteShipment(id);
    setDeletingId(null);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          Shipments
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className={`${buttonStyles.small} text-primary hover:bg-primary/5`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Shipment
          </button>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className={`${cardStyles.compact} space-y-3`}
        >
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            {editingId ? "Edit Shipment" : "New Shipment"}
          </h3>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Carrier *
              </label>
              <select
                value={carrierSelection}
                onChange={(e) => setCarrierSelection(e.target.value)}
                className={`${formStyles.select} !py-2 text-sm`}
                disabled={loading}
              >
                <option value="">Select carrier...</option>
                {CARRIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {carrierSelection === "Other" && (
                <input
                  type="text"
                  value={carrierCustom}
                  onChange={(e) => setCarrierCustom(e.target.value)}
                  placeholder="Enter carrier name"
                  className={`${formStyles.input} !py-2 text-sm mt-2`}
                  disabled={loading}
                />
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="1Z999AA10123456784"
                className={`${formStyles.input} !py-2 text-sm`}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Tracking URL *
              </label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
                className={`${formStyles.input} !py-2 text-sm`}
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
                className={`${formStyles.select} !py-2 text-sm`}
                disabled={loading}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className={`${formStyles.input} !py-2 text-sm`}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              disabled={loading}
              className={`${buttonStyles.small} text-muted-foreground hover:bg-muted`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${buttonStyles.small} bg-primary px-3 py-1.5 text-white hover:bg-primary-hover`}
            >
              {loading
                ? "Saving..."
                : editingId
                  ? "Update Shipment"
                  : "Add Shipment"}
            </button>
          </div>
        </form>
      )}

      {/* Existing shipments list */}
      {initialShipments.length === 0 && !showForm ? (
        <p className="text-xs text-muted-foreground">
          No shipments added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {initialShipments.map((shipment) => (
            <div
              key={shipment.id}
              className={`${cardStyles.compact} !py-3`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {shipment.carrier_name}
                    </span>
                    <Badge variant={shipment.status}>
                      {STATUS_LABELS[shipment.status] ?? shipment.status}
                    </Badge>
                  </div>
                  {shipment.tracking_number && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {shipment.tracking_number}
                    </p>
                  )}
                  {shipment.notes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {shipment.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {shipment.tracking_url && (
                    <a
                      href={shipment.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Open tracking URL"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(shipment)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Edit"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(shipment.id)}
                    disabled={deletingId === shipment.id}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
