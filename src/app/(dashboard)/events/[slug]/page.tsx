import { notFound } from "next/navigation";
import { getEvent, getEventStats } from "@/lib/actions/events";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { EventDetailView } from "@/components/events/event-detail-view";
import type { Racer } from "@/types/events";

export const dynamic = "force-dynamic";

async function getRacers(eventId: string): Promise<Racer[]> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("racers")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });
  return (data ?? []) as Racer[];
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) notFound();

  const [racers, stats] = await Promise.all([
    getRacers(event.id),
    getEventStats(event.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {event.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.config?.track_name ?? "No track set"} ·{" "}
            <span
              className={`inline-flex items-center gap-1 ${
                event.status === "active" ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {event.status === "active" ? "Active" : "Archived"}
            </span>
          </p>
        </div>
        <a
          href={`https://simsforhire.com/live/${event.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-white/20 transition-colors"
        >
          View Live ↗
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Racers", value: stats.totalRacers },
          { label: "In Queue", value: stats.inQueue },
          { label: "Completed", value: stats.completed },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-white p-4"
          >
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <EventDetailView event={event} racers={racers} stats={stats} />
    </div>
  );
}
