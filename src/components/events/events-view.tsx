"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { archiveEvent, deleteEvent } from "@/lib/actions/events";
import type { EventWithConfig, EventStats } from "@/types/events";

interface EventsViewProps {
  events: EventWithConfig[];
  statsMap: Record<string, EventStats>;
}

export function EventsView({ events: initial, statsMap }: EventsViewProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initial);
  const [isPending, startTransition] = useTransition();

  // Inline two-stage confirm: which event id is currently armed for which action.
  const [confirmingArchive, setConfirmingArchive] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  function armArchive(id: string) {
    setConfirmingDelete(null);
    setConfirmingArchive(id);
    window.setTimeout(
      () => setConfirmingArchive((cur) => (cur === id ? null : cur)),
      5000
    );
  }
  function armDelete(id: string) {
    setConfirmingArchive(null);
    setConfirmingDelete(id);
    window.setTimeout(
      () => setConfirmingDelete((cur) => (cur === id ? null : cur)),
      5000
    );
  }

  function handleArchive(id: string) {
    setConfirmingArchive(null);
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "archived" as const } : e))
    );
    startTransition(async () => {
      await archiveEvent(id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setConfirmingDelete(null);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    startTransition(async () => {
      await deleteEvent(id);
      router.refresh();
    });
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-20 gap-5">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No events yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create your first live karting event or waiver event</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/events/new"
            className="rounded-lg bg-[#E10600] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            + New Event
          </Link>
          <Link
            href="/events/new-waiver"
            className="rounded-lg border border-border bg-white px-4 py-2 text-[13px] font-medium text-foreground hover:border-foreground/30 transition-colors"
          >
            + New Waiver Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">
          {events.length} Event{events.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <Link
            href="/events/new"
            className="rounded-lg bg-[#E10600] px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            + New Event
          </Link>
          <Link
            href="/events/new-waiver"
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-foreground hover:border-foreground/30 transition-colors"
          >
            + New Waiver Event
          </Link>
        </div>
      </div>

      {(() => {
        const waiverEvents = events.filter((e) => e.event_type === "waiver");
        const raceEvents = events.filter((e) => e.event_type !== "waiver");
        const renderCard = (event: typeof events[number]) => {
          const stats = statsMap[event.id] ?? { totalRacers: 0, inQueue: 0, completed: 0 };
          const isWaiver = event.event_type === "waiver";
          const liveHref = isWaiver
            ? `/waiver/${event.slug}`
            : `https://simsforhire.com/live/${event.slug}`;
          return (
            <div
              key={event.id}
              className="rounded-xl border border-border bg-white p-4 space-y-3"
            >
              {/* */}
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-foreground truncate">{event.name}</p>
                    {isWaiver && (
                      <span className="shrink-0 rounded-full bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                        Waiver
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    /{event.slug}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    event.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {event.status}
                </span>
              </div>

              {/* Stats */}
              {isWaiver ? (
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                  <span>{stats.totalRacers} signed</span>
                </div>
              ) : (
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                  <span>{stats.totalRacers} racers</span>
                  <span>·</span>
                  <span>{stats.inQueue} in queue</span>
                  <span>·</span>
                  <span>{stats.completed} done</span>
                </div>
              )}

              {/* Track / date (race events only) */}
              {!isWaiver && (event.config?.track_name || event.config?.event_date) && (
                <p className="text-[11px] text-muted-foreground">
                  {event.config?.track_name}
                  {event.config?.track_name && event.config?.event_date && " · "}
                  {event.config?.event_date}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <Link
                  href={`/events/${event.slug}`}
                  className="flex-1 rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-center text-[12px] font-medium text-white hover:opacity-80 transition-opacity"
                >
                  Manage
                </Link>
                <a
                  href={liveHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {isWaiver ? "Sign ↗" : "Live ↗"}
                </a>
                {event.status === "active" && (
                  <button
                    onClick={() =>
                      confirmingArchive === event.id
                        ? handleArchive(event.id)
                        : armArchive(event.id)
                    }
                    disabled={isPending}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] transition-colors disabled:opacity-40 ${
                      confirmingArchive === event.id
                        ? "border-amber-400 bg-amber-50 text-amber-700 font-bold"
                        : "border-border text-muted-foreground hover:text-amber-600 hover:border-amber-200"
                    }`}
                    title={confirmingArchive === event.id ? "Click again to confirm" : "Archive event"}
                  >
                    {confirmingArchive === event.id ? "Confirm?" : "Archive"}
                  </button>
                )}
                <button
                  onClick={() =>
                    confirmingDelete === event.id
                      ? handleDelete(event.id)
                      : armDelete(event.id)
                  }
                  disabled={isPending}
                  className={`rounded-lg border transition-colors disabled:opacity-40 ${
                    confirmingDelete === event.id
                      ? "border-red-400 bg-red-50 text-red-700 px-2 py-1 text-[11px] font-bold"
                      : "border-border text-muted-foreground hover:text-[#E10600] hover:border-red-200 p-1.5"
                  }`}
                  title={confirmingDelete === event.id ? "Click again to confirm permanent delete" : "Delete event"}
                >
                  {confirmingDelete === event.id ? (
                    "Delete?"
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-8">
            {waiverEvents.length > 0 && (
              <section>
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Waiver Only · {waiverEvents.length}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {waiverEvents.map(renderCard)}
                </div>
              </section>
            )}
            {raceEvents.length > 0 && (
              <section>
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Event + Race Board · {raceEvents.length}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {raceEvents.map(renderCard)}
                </div>
              </section>
            )}
          </div>
        );
      })()}
    </div>
  );
}
