"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationWithProject,
} from "@/lib/actions/notifications";

interface NotificationListProps {
  initialNotifications: NotificationWithProject[];
}

/** Icon per notification type */
function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "items_accepted":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
      );
    case "items_decided":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
        </div>
      );
    case "client_note":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </div>
      );
    case "item_deleted":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
          <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
      );
    case "contact_message":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100">
          <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
      );
    default:
      return <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />;
  }
}

export function NotificationList({ initialNotifications }: NotificationListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);

  async function handleDismiss(notificationId: string) {
    await markNotificationRead(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    router.refresh();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications([]);
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
    <div>
      {/* Mark all read button */}
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs font-medium text-primary hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {notifications.map((n, idx) => (
          <div
            key={n.id}
            className={`group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/50 ${
              idx < notifications.length - 1 ? "border-b border-border/50" : ""
            }`}
          >
            <NotificationIcon type={n.type} />

            <div className="min-w-0 flex-1">
              <Link href={n.link ?? `/projects/${n.project_id}`} className="block">
                <p className="text-sm font-semibold text-foreground">
                  {n.title}
                </p>
                {n.body && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                    {n.body}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {n.clientName} &middot; {n.projectName}
                </p>
              </Link>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(n.created_at)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDismiss(n.id)}
                  className="text-xs font-medium text-primary transition-opacity hover:underline"
                >
                  Mark as read
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
