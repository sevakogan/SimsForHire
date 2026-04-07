"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatus, sendNda } from "@/lib/actions/jobs";
import { cardStyles, buttonStyles, formStyles } from "@/components/ui/form-styles";
import type { JobApplication, ApplicationStatus } from "@/lib/jobs/types";

interface ApplicantDetailProps {
  readonly application: JobApplication;
  readonly resumeSignedUrl: string | null;
  readonly imageSignedUrls: readonly string[];
}

const STATUS_STYLES: Record<
  ApplicationStatus,
  { bg: string; text: string; label: string }
> = {
  new: { bg: "bg-blue-50", text: "text-blue-700", label: "New" },
  reviewed: { bg: "bg-violet-50", text: "text-violet-700", label: "Reviewed" },
  contacted: { bg: "bg-amber-50", text: "text-amber-700", label: "Contacted" },
  in_process: { bg: "bg-sky-50", text: "text-sky-700", label: "In Process" },
  hired: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Hired" },
  rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
};

const STATUS_OPTIONS: readonly { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "contacted", label: "Contacted" },
  { value: "in_process", label: "In Process" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function instagramUrl(value: string): string {
  if (value.startsWith("http")) return value;
  const handle = value.replace(/^@/, "");
  return `https://instagram.com/${handle}`;
}

interface NdaFormData {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly requireDl?: boolean;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1] ?? "",
  };
}

function TimelineStep({
  label,
  timestamp,
  done,
  isLast,
  icon,
}: {
  label: string;
  timestamp: string | null;
  done: boolean;
  isLast: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            done
              ? "bg-emerald-100 text-emerald-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {icon}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[24px] ${
              done ? "bg-emerald-200" : "bg-gray-200"
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className="pb-5">
        <p
          className={`text-sm font-medium ${
            done ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </p>
        {timestamp ? (
          <p className="text-xs text-muted-foreground">
            {formatDate(timestamp)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">Pending</p>
        )}
      </div>
    </div>
  );
}

function NdaConfirmModal({
  application,
  onSubmit,
  onClose,
  isLoading,
}: {
  readonly application: JobApplication;
  readonly onSubmit: (data: NdaFormData) => void;
  readonly onClose: () => void;
  readonly isLoading: boolean;
}) {
  const { firstName, lastName } = splitFullName(application.full_name);
  const [form, setForm] = useState<NdaFormData>({
    firstName,
    lastName,
    email: application.email,
    phone: application.phone ?? "",
    requireDl: true,
  });

  function handleFieldChange(field: keyof NdaFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg mx-4">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-foreground">
            Verify Applicant Information
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This information will be included in the NDA
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className={formStyles.group}>
              <label htmlFor="nda-first-name" className={formStyles.label}>
                First Name
              </label>
              <input
                id="nda-first-name"
                type="text"
                required
                value={form.firstName}
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
                className={formStyles.input}
              />
            </div>
            <div className={formStyles.group}>
              <label htmlFor="nda-last-name" className={formStyles.label}>
                Last Name
              </label>
              <input
                id="nda-last-name"
                type="text"
                required
                value={form.lastName}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                className={formStyles.input}
              />
            </div>
          </div>

          <div className={formStyles.group}>
            <label htmlFor="nda-email" className={formStyles.label}>
              Email
            </label>
            <input
              id="nda-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.group}>
            <label htmlFor="nda-phone" className={formStyles.label}>
              Phone
            </label>
            <input
              id="nda-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              className={formStyles.input}
            />
          </div>

          {/* DL Requirement checkbox */}
          <label className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={form.requireDl ?? true}
              onChange={(e) => setForm((prev) => ({ ...prev, requireDl: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Request Driver&apos;s License</p>
              <p className="text-xs text-muted-foreground">Applicant will be asked to upload front &amp; back of their ID after signing</p>
            </div>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={buttonStyles.secondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={buttonStyles.primary}
            >
              {isLoading ? "Sending..." : "Send & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ApplicantDetail({
  application,
  resumeSignedUrl,
  imageSignedUrls,
}: ApplicantDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [ndaLoading, setNdaLoading] = useState(false);
  const [ndaError, setNdaError] = useState<string | null>(null);
  const [ndaSentAt, setNdaSentAt] = useState<string | null>(
    application.nda_sent_at ?? null
  );
  const [ndaOpenedAt, setNdaOpenedAt] = useState<string | null>(
    application.nda_opened_at ?? null
  );
  const [ndaSignedAt, setNdaSignedAt] = useState<string | null>(
    application.nda_signed_at ?? null
  );
  const [ndaEmailOpenedAt, setNdaEmailOpenedAt] = useState<string | null>(
    application.nda_email_opened_at ?? null
  );
  const [ndaEmailOpenCount, setNdaEmailOpenCount] = useState<number>(
    application.nda_email_open_count ?? 0
  );
  const [ndaPdfUrl, setNdaPdfUrl] = useState<string | null>(null);
  const [dlFrontUrl, setDlFrontUrl] = useState<string | null>(
    application.dl_front_url ?? null
  );
  const [dlBackUrl, setDlBackUrl] = useState<string | null>(
    application.dl_back_url ?? null
  );
  const [dlSubmittedAt, setDlSubmittedAt] = useState<string | null>(
    application.dl_submitted_at ?? null
  );
  const [dlUploading, setDlUploading] = useState(false);
  const [dlPreview, setDlPreview] = useState<string | null>(null);
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [bgCheckUrl, setBgCheckUrl] = useState(
    application.background_check_url ?? ""
  );
  const [bgSaving, setBgSaving] = useState(false);
  const [bgSaved, setBgSaved] = useState(false);

  const statusStyle = STATUS_STYLES[status];

  // Poll for NDA status changes every 10s when NDA is sent but not signed
  const pollNdaStatus = useCallback(async () => {
    if (!ndaSentAt || ndaSignedAt) return;
    try {
      const res = await fetch(`/api/jobs/applications/${application.id}`);
      if (!res.ok) return;
      const result = await res.json();
      const data = result.data ?? result;
      if (data.nda_email_opened_at && !ndaEmailOpenedAt) {
        setNdaEmailOpenedAt(data.nda_email_opened_at);
      }
      if (data.nda_email_open_count > ndaEmailOpenCount) {
        setNdaEmailOpenCount(data.nda_email_open_count);
      }
      if (data.nda_opened_at && !ndaOpenedAt) {
        setNdaOpenedAt(data.nda_opened_at);
      }
      if (data.nda_signed_at && !ndaSignedAt) {
        setNdaSignedAt(data.nda_signed_at);
        router.refresh();
      }
    } catch {
      // silent
    }
  }, [ndaSentAt, ndaSignedAt, ndaOpenedAt, ndaEmailOpenedAt, ndaEmailOpenCount, application.id, router]);

  useEffect(() => {
    if (!ndaSentAt || ndaSignedAt) return;
    const interval = setInterval(pollNdaStatus, 10000);
    return () => clearInterval(interval);
  }, [ndaSentAt, ndaSignedAt, pollNdaStatus]);

  function handleStatusChange(newStatus: ApplicationStatus) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateApplicationStatus(application.id, newStatus);
      router.refresh();
    });
  }

  async function handleSendNda(overrides?: NdaFormData) {
    setNdaLoading(true);
    setNdaError(null);
    try {
      const result = await sendNda(application.id, overrides ?? undefined);
      if (result.error) {
        throw new Error(result.error);
      }
      setShowNdaModal(false);
      setNdaSentAt(new Date().toISOString());
      router.refresh();
    } catch (err) {
      setNdaError(
        err instanceof Error ? err.message : "Failed to send NDA"
      );
    } finally {
      setNdaLoading(false);
    }
  }

  function handleOpenNdaModal() {
    setNdaError(null);
    setShowNdaModal(true);
  }

  async function handleSaveBgCheck() {
    setBgSaving(true);
    setBgSaved(false);
    try {
      const res = await fetch(
        `/api/jobs/applications/${application.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ background_check_url: bgCheckUrl }),
        }
      );
      if (!res.ok) throw new Error("Failed to save");
      setBgSaved(true);
      router.refresh();
      setTimeout(() => setBgSaved(false), 2000);
    } catch {
      // error state could be added here
    } finally {
      setBgSaving(false);
    }
  }

  async function fetchNdaPdfUrl(): Promise<string | null> {
    try {
      const res = await fetch(
        `/api/jobs/applications/${application.id}/nda/download`
      );
      if (!res.ok) return null;
      const body = (await res.json()) as { url?: string };
      return body.url ?? null;
    } catch {
      return null;
    }
  }

  async function handleViewNda() {
    const url = ndaPdfUrl || (await fetchNdaPdfUrl());
    if (url) {
      setNdaPdfUrl(url);
      window.open(url, "_blank");
    }
  }

  async function handleDownloadNda() {
    const url = ndaPdfUrl || (await fetchNdaPdfUrl());
    if (url) {
      setNdaPdfUrl(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NDA-${application.full_name.replace(/\s+/g, "-")}.pdf`;
      a.click();
    }
  }

  async function handleDlUpload(side: "front" | "back", file: File) {
    setDlUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("side", side);

      const res = await fetch(
        `/api/jobs/applications/${application.id}/dl/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Upload failed");
      }

      const result = await res.json();
      const url = result.url as string;

      if (side === "front") setDlFrontUrl(url);
      else setDlBackUrl(url);

      // If both uploaded, mark as submitted
      const otherSide = side === "front" ? dlBackUrl : dlFrontUrl;
      if (otherSide || (side === "front" && dlBackUrl) || (side === "back" && dlFrontUrl)) {
        setDlSubmittedAt(new Date().toISOString());
      }

      router.refresh();
    } catch (err) {
      console.error("[DL Upload]", err);
    } finally {
      setDlUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className={cardStyles.base}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              {application.full_name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {application.job_title ?? "Unknown Position"}
            </p>
            <p className="text-xs text-muted-foreground">
              Applied {formatDate(application.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
            >
              {statusStyle.label}
            </span>
            <select
              value={status}
              onChange={(e) =>
                handleStatusChange(e.target.value as ApplicationStatus)
              }
              disabled={isPending}
              className={`rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact Grid */}
      <div className={cardStyles.base}>
        <p className="mb-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
          Contact Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Email
            </p>
            <a
              href={`mailto:${application.email}`}
              className="text-sm text-primary hover:underline truncate block"
            >
              {application.email}
            </a>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Phone
            </p>
            <a
              href={`tel:${application.phone}`}
              className="text-sm text-primary hover:underline"
            >
              {application.phone}
            </a>
          </div>
          {application.instagram && (
            <div>
              <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
                Instagram
              </p>
              <a
                href={instagramUrl(application.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 hover:underline transition-colors"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                @{application.instagram.replace(/^@/, "")}
              </a>
            </div>
          )}
          {application.socials.length > 0 && (
            <div className="col-span-1 sm:col-span-2">
              <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground mb-2">
                Socials
              </p>
              <div className="flex flex-wrap gap-2">
                {application.socials.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {s.platform}: {s.handle}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About Me */}
      {application.about_me && (
        <div className={cardStyles.base}>
          <p className="mb-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
            About Me
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {application.about_me}
          </p>
        </div>
      )}

      {/* Resume */}
      {resumeSignedUrl && (
        <div className={cardStyles.base}>
          <p className="mb-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
            Resume
          </p>
          <a
            href={resumeSignedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles.secondary}
          >
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
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download Resume
          </a>
        </div>
      )}

      {/* Photos */}
      {imageSignedUrls.length > 0 && (
        <div className={cardStyles.base}>
          <p className="mb-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
            Photos
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageSignedUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* NDA + Driver's License — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* NDA Status Report */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <p className="mb-5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
          NDA Status Report
        </p>

        {/* Timeline */}
        <div className="space-y-0">
          {/* Step 1: NDA Sent */}
          <TimelineStep
            label="NDA Sent"
            timestamp={ndaSentAt}
            done={!!ndaSentAt}
            isLast={false}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            }
          />

          {/* Step 2: Email Opened */}
          <TimelineStep
            label={`Email Opened${ndaEmailOpenCount > 1 ? ` (${ndaEmailOpenCount}x)` : ""}`}
            timestamp={ndaEmailOpenedAt}
            done={!!ndaEmailOpenedAt}
            isLast={false}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
              </svg>
            }
          />

          {/* Step 3: NDA Opened */}
          <TimelineStep
            label="NDA Opened"
            timestamp={ndaOpenedAt}
            done={!!ndaOpenedAt}
            isLast={false}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            }
          />

          {/* Step 3: NDA Signed */}
          <TimelineStep
            label="NDA Signed"
            timestamp={ndaSignedAt}
            done={!!ndaSignedAt}
            isLast={true}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            }
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {ndaSignedAt ? (
            <>
              <button onClick={handleViewNda} className={buttonStyles.secondary}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                View NDA
              </button>
              <button onClick={handleDownloadNda} className={buttonStyles.secondary}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download
              </button>
            </>
          ) : ndaSentAt ? (
            <>
              <button
                onClick={handleOpenNdaModal}
                disabled={ndaLoading}
                className={buttonStyles.secondary}
              >
                {ndaLoading ? "Sending..." : "Resend NDA"}
              </button>
              <span className="text-xs text-muted-foreground italic">Awaiting signature...</span>
            </>
          ) : (
            <button
              onClick={handleOpenNdaModal}
              disabled={ndaLoading}
              className={buttonStyles.danger}
            >
              {ndaLoading ? "Sending..." : "Send NDA"}
            </button>
          )}
        </div>
        {ndaError && (
          <p className="mt-2 text-xs text-destructive">{ndaError}</p>
        )}
      </div>

      {/* Driver's License */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <p className="mb-5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
          Driver&apos;s License
        </p>

        <div className="space-y-4">
          {/* Timeline */}
          <div className="space-y-0">
            <TimelineStep
              label="Front Uploaded"
              timestamp={dlFrontUrl ? (dlSubmittedAt ?? new Date().toISOString()) : null}
              done={!!dlFrontUrl}
              isLast={false}
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              }
            />
            <TimelineStep
              label="Back Uploaded"
              timestamp={dlBackUrl ? (dlSubmittedAt ?? new Date().toISOString()) : null}
              done={!!dlBackUrl}
              isLast={false}
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              }
            />
            <TimelineStep
              label="Submitted"
              timestamp={dlFrontUrl && dlBackUrl ? dlSubmittedAt : null}
              done={!!dlFrontUrl && !!dlBackUrl}
              isLast={true}
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              }
            />

            {/* Upload buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {!dlFrontUrl && (
                <label className={`${buttonStyles.secondary} cursor-pointer`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  {dlUploading ? "Uploading..." : "Upload Front"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={dlUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDlUpload("front", file);
                    }}
                  />
                </label>
              )}
              {!dlBackUrl && (
                <label className={`${buttonStyles.secondary} cursor-pointer`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  {dlUploading ? "Uploading..." : "Upload Back"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={dlUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDlUpload("back", file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Preview images */}
          <div className="grid grid-cols-2 gap-2">
            {dlFrontUrl && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Front</p>
                <button
                  type="button"
                  onClick={() => setDlPreview(dlFrontUrl)}
                  className="block w-full overflow-hidden rounded-lg border border-border hover:border-primary/40 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dlFrontUrl} alt="DL Front" className="w-full h-auto object-contain" />
                </button>
              </div>
            )}
            {dlBackUrl && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Back</p>
                <button
                  type="button"
                  onClick={() => setDlPreview(dlBackUrl)}
                  className="block w-full overflow-hidden rounded-lg border border-border hover:border-primary/40 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dlBackUrl} alt="DL Back" className="w-full h-auto object-contain" />
                </button>
              </div>
            )}
            {!dlFrontUrl && !dlBackUrl && (
              <div className="flex items-center justify-center h-full min-h-[100px] rounded-lg border border-dashed border-border">
                <p className="text-xs text-muted-foreground">No photos uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      </div>{/* end grid */}

      {/* DL Image Preview Modal */}
      {dlPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setDlPreview(null)}
        >
          <div className="relative max-h-[90vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setDlPreview(null)}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg text-foreground hover:bg-gray-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dlPreview} alt="Driver's License" className="max-h-[85vh] w-auto rounded-xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* NDA Confirmation Modal */}
      {showNdaModal && (
        <NdaConfirmModal
          application={application}
          onSubmit={handleSendNda}
          onClose={() => setShowNdaModal(false)}
          isLoading={ndaLoading}
        />
      )}

      {/* Background Check Card */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <p className="mb-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
          Background Check
        </p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="bg-check-url" className={formStyles.label}>
              Background Check URL
            </label>
            <input
              id="bg-check-url"
              type="url"
              value={bgCheckUrl}
              onChange={(e) => {
                setBgCheckUrl(e.target.value);
                setBgSaved(false);
              }}
              placeholder="https://..."
              className={formStyles.input}
            />
          </div>
          <button
            onClick={handleSaveBgCheck}
            disabled={bgSaving}
            className={buttonStyles.primary}
          >
            {bgSaving ? "Saving..." : bgSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
