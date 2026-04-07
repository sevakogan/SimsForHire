"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatus } from "@/lib/actions/jobs";
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
  const [ndaSignedAt] = useState<string | null>(
    application.nda_signed_at ?? null
  );
  const [bgCheckUrl, setBgCheckUrl] = useState(
    application.background_check_url ?? ""
  );
  const [bgSaving, setBgSaving] = useState(false);
  const [bgSaved, setBgSaved] = useState(false);

  const statusStyle = STATUS_STYLES[status];

  function handleStatusChange(newStatus: ApplicationStatus) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateApplicationStatus(application.id, newStatus);
      router.refresh();
    });
  }

  async function handleSendNda() {
    setNdaLoading(true);
    setNdaError(null);
    try {
      const res = await fetch(
        `/api/jobs/applications/${application.id}/nda/send`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to send NDA"
        );
      }
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

  async function handleDownloadNda() {
    try {
      const res = await fetch(
        `/api/jobs/applications/${application.id}/nda/download`
      );
      if (!res.ok) throw new Error("Failed to get NDA URL");
      const body = (await res.json()) as { url?: string };
      if (body.url) {
        window.open(body.url, "_blank");
      }
    } catch {
      // silent fail
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

      {/* NDA Card */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <p className="mb-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
          NDA
        </p>

        {ndaSignedAt ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                <svg
                  className="h-4 w-4 text-emerald-600"
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
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  NDA Signed
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(ndaSignedAt)}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadNda}
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
              Download Signed NDA
            </button>
          </div>
        ) : ndaSentAt ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                <svg
                  className="h-4 w-4 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700">NDA Sent</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(ndaSentAt)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Awaiting signature...
            </p>
            <button
              onClick={handleSendNda}
              disabled={ndaLoading}
              className={buttonStyles.secondary}
            >
              {ndaLoading ? "Sending..." : "Resend NDA"}
            </button>
            {ndaError && (
              <p className="text-xs text-destructive">{ndaError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No NDA has been sent to this applicant yet.
            </p>
            <button
              onClick={handleSendNda}
              disabled={ndaLoading}
              className={buttonStyles.danger}
            >
              {ndaLoading ? "Sending..." : "Send NDA"}
            </button>
            {ndaError && (
              <p className="text-xs text-destructive">{ndaError}</p>
            )}
          </div>
        )}
      </div>

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
