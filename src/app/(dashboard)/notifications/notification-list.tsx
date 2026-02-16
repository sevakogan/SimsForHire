"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markNoteRead, type UnreadNotification } from "@/lib/actions/items";

interface NotificationListProps {
  initialNotifications: UnreadNotification[];
}

export function NotificationList({ initialNotifications }: NotificationListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);

  async function handleDismiss(itemId: string) {
    await markNoteRead(itemId);
    setNotifications((prev) => prev.filter((n) => n.itemId !== itemId));
    router.refresh();
  }

  function formatTimeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white py-16 text-center shadow-sm">
        <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          All caught up! No unread notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {notifications.map((n, idx) => (
        <div
          key={n.itemId}
          className={`group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/50 ${
            idx < notifications.length - 1 ? "border-b border-border/50" : ""
          }`}
        >
          {/* Blue dot */}
          <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />

          <div className="min-w-0 flex-1">
            <Link href={`/projects/${n.projectId}`} className="block">
              <p className="text-sm font-semibold text-foreground">
                {n.clientName} &middot; {n.projectName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                &ldquo;{n.clientNote}&rdquo;
              </p>
              {n.itemDescription && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Item: {n.itemDescription}
                </p>
              )}
            </Link>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(n.createdAt)}
              </span>
              <button
                type="button"
                onClick={() => handleDismiss(n.itemId)}
                className="text-xs font-medium text-primary transition-opacity hover:underline"
              >
                Mark as read
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
