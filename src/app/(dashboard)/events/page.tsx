import { getEvents } from "@/lib/actions/events";
import { getEventStats } from "@/lib/actions/events";
import { EventsView } from "@/components/events/events-view";
import type { EventWithConfig, EventStats } from "@/types/events";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getEvents();

  const statsResults = await Promise.all(
    events.map((e) => getEventStats(e.id))
  );

  const statsMap = new Map<string, EventStats>();
  events.forEach((e, i) => statsMap.set(e.id, statsResults[i]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Live Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage karting events, racers, and live leaderboards
        </p>
      </div>
      <EventsView events={events} statsMap={Object.fromEntries(statsMap)} />
    </div>
  );
}
