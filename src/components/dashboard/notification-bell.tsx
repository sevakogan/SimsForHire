"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getUnreadNotifications,
  getTotalUnreadNoteCount,
  markNoteRead,
  type UnreadNotification,
} from "@/lib/actions/items";

const MAX_DROPDOWN_ITEMS = 5;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UnreadNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [notes, count] = await Promise.all([
        getUnreadNotifications(MAX_DROPDOWN_ITEMS),
        getTotalUnreadNoteCount(),
      ]);
      setNotifications(notes);
      setTotalCount(count);
      setLoading(false);
    }
    load();
  }, []);

  // Refetch when dropdown opens
  useEffect(() => {
    if (!open) return;
    async function refresh() {
      const [notes, count] = await Promise.all([
        getUnreadNotifications(MAX_DROPDOWN_ITEMS),
        getTotalUnreadNoteCount(),
      ]);
      setNotifications(notes);
      setTotalCount(count);
    }
    refresh();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [open]);

  async function handleDismiss(itemId: string) {
    await markNoteRead(itemId);
    setNotifications((prev) => prev.filter((n) => n.itemId !== itemId));
    setTotalCount((prev) => Math.max(0, prev - 1));
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
    return `${diffDays}d ago`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {/* Badge */}
        {!loading && totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {totalCount > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                {totalCount} unread
              </span>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.itemId}
                  className="group flex items-start gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-muted/50 last:border-b-0"
                >
                  {/* Blue dot */}
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${n.projectId}`}
                      onClick={() => setOpen(false)}
                      className="block"
                    >
                      <p className="text-xs font-semibold text-foreground truncate">
                        {n.clientName} &middot; {n.projectName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        &ldquo;{n.clientNote}&rdquo;
                      </p>
                      {n.itemDescription && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground/70 truncate">
                          Item: {n.itemDescription}
                        </p>
                      )}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDismiss(n.itemId)}
                        className="text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
                      >
                        Mark read
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer — show "View all" when there are more than shown */}
          {totalCount > MAX_DROPDOWN_ITEMS && (
            <div className="border-t border-border">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center py-2.5 text-xs font-medium text-primary transition-colors hover:bg-muted"
              >
                View all notifications ({totalCount})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
