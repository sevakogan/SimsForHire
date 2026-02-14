"use client";

import { useState } from "react";
import { markNoteRead } from "@/lib/actions/items";

interface ClientNoteBannerProps {
  itemId: string;
  note: string;
  isUnread: boolean;
}

export function ClientNoteBanner({ itemId, note, isUnread }: ClientNoteBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const showUnread = isUnread && !dismissed;

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 transition-opacity ${
        showUnread
          ? "border-blue-200 bg-blue-50"
          : "border-gray-200 bg-gray-50 opacity-60"
      }`}
    >
      <svg
        className={`h-4 w-4 shrink-0 mt-0.5 ${showUnread ? "text-blue-500" : "text-gray-400"}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
      </svg>
      <div className="flex-1">
        <p className={`text-xs font-semibold ${showUnread ? "text-blue-700" : "text-gray-500"}`}>
          Client Note {!showUnread && "(read)"}
        </p>
        <p className={`text-sm italic mt-0.5 ${showUnread ? "text-blue-600" : "text-gray-500"}`}>
          &ldquo;{note}&rdquo;
        </p>
      </div>
      {showUnread && (
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            markNoteRead(itemId);
          }}
          className="shrink-0 rounded-md border border-blue-200 bg-white px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        >
          Mark Read
        </button>
      )}
    </div>
  );
}
