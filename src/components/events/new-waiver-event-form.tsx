"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWaiverEvent } from "@/lib/actions/waiver-events";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const PLACEHOLDER_WAIVER = `[YOUR EVENT NAME] — Participant Waiver

By signing below, I acknowledge and agree to the following:

1. ASSUMPTION OF RISK
I understand that participation involves inherent risks...

2. RELEASE OF LIABILITY
I release and hold harmless [Organization Name]...

3. PHOTO / VIDEO RELEASE
I grant permission to use my likeness in marketing materials...

4. ELECTRONIC SIGNATURE
By submitting this form, I provide my electronic signature, which has the same legal force as a handwritten signature.
`;

export function NewWaiverEventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [waiverBody, setWaiverBody] = useState(PLACEHOLDER_WAIVER);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlug(slugify(value));
    setSlugEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !waiverBody.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const event = await createWaiverEvent({
        name: name.trim(),
        slug: slug.trim(),
        waiverBody: waiverBody.trim(),
      });
      router.push(`/events/${event.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create waiver event");
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-white p-6 space-y-4"
      >
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">
            Event Name <span className="text-[#E10600]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Miami Auto Show 2026"
            className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">
            URL Slug <span className="text-[#E10600]">*</span>
          </label>
          <div className="flex items-center rounded-lg border border-border bg-[#F5F5F7] overflow-hidden">
            <span className="px-3 text-[12px] text-muted-foreground border-r border-border bg-muted/50 py-2">
              /waiver/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              placeholder="miami-auto-show-2026"
              className="flex-1 bg-transparent px-3 py-2 text-[13px] focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Public sign page will live at this URL. The QR code will point here.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">
            Waiver Text <span className="text-[#E10600]">*</span>
          </label>
          <textarea
            value={waiverBody}
            onChange={(e) => setWaiverBody(e.target.value)}
            required
            rows={18}
            className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[12px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
          />
          <p className="text-[11px] text-muted-foreground">
            Edit and republish anytime — every signature snapshots which version was accepted.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-[#E10600] py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? "Creating…" : "Create Waiver Event"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/events")}
            className="rounded-lg border border-border px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
