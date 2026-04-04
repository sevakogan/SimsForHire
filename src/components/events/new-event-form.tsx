"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/actions/events";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function NewEventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(slugify(value));
    setSlugEdited(true);
  }

  function handlePinChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setAdminPin(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || adminPin.length !== 4) {
      setError("Please fill in all required fields. PIN must be 4 digits.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const event = await createEvent({
        name: name.trim(),
        slug: slug.trim(),
        theme: undefined,
        adminPin,
      });

      // Also update config with track/dealer if provided
      if (trackName || dealerName) {
        const { updateEventConfig } = await import("@/lib/actions/events");
        await updateEventConfig(event.id, {
          track_name: trackName.trim() || null,
          dealer_name: dealerName.trim() || null,
        });
      }

      router.push(`/events/${event.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
      setPending(false);
    }
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white p-6 space-y-4">
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
            placeholder="e.g. Spring Karting Championship"
            className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">
            URL Slug <span className="text-[#E10600]">*</span>
          </label>
          <div className="flex items-center rounded-lg border border-border bg-[#F5F5F7] overflow-hidden">
            <span className="px-3 text-[12px] text-muted-foreground border-r border-border bg-muted/50 py-2">
              simsforhire.com/live/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              placeholder="spring-karting-2025"
              className="flex-1 bg-transparent px-3 py-2 text-[13px] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">
            Admin PIN <span className="text-[#E10600]">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={adminPin}
            onChange={(e) => handlePinChange(e.target.value)}
            required
            placeholder="4-digit PIN"
            maxLength={4}
            className="w-32 rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
          />
          <p className="text-[11px] text-muted-foreground">Used to access the admin panel and reset event data</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">Track Name</label>
          <input
            type="text"
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            placeholder="e.g. Miami Kart Track"
            className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">Dealer / Client Name</label>
          <input
            type="text"
            value={dealerName}
            onChange={(e) => setDealerName(e.target.value)}
            placeholder="e.g. Acme Dealership"
            className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-[#E10600] py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? "Creating…" : "Create Event"}
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
