"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWaiverDisplayName } from "@/lib/actions/waiver-events";

interface Props {
  eventId: string;
  initialName: string;
  /** The slug — shown read-only to clarify URL stays the same. */
  slug: string;
}

/**
 * Inline editor for the public-facing display name on a waiver event.
 *
 * URL slug stays immutable (it's the QR target). Only the human-readable
 * name shown on the waiver page changes. Stored in event_config.event_name.
 */
export function EditableDisplayName({ eventId, initialName, slug }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialName);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    if (!draft.trim() || draft.trim() === initialName.trim()) {
      setEditing(false);
      setDraft(initialName);
      return;
    }
    startTransition(async () => {
      const result = await updateWaiverDisplayName(eventId, draft);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function cancel() {
    setDraft(initialName);
    setEditing(false);
    setError(null);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancel();
            }}
            className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-2xl font-semibold tracking-tight text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF5BA7]/40 focus:border-[#FF5BA7]"
          />
          <button
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-[#FF5BA7] px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={cancel}
            disabled={pending}
            className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="text-[12px] text-red-600">{error}</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          URL stays as <span className="font-mono">/waiver/{slug}</span> — only the name on the page changes.
        </p>
      </div>
    );
  }

  return (
    <div className="group">
      <button
        onClick={() => setEditing(true)}
        className="text-left"
        title="Click to rename"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground group-hover:text-[#FF5BA7] transition-colors">
          {initialName}{" "}
          <span className="ml-1 text-[12px] font-normal text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            ✎ rename
          </span>
        </h1>
      </button>
    </div>
  );
}
