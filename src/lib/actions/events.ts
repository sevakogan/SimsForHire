"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { LiveEvent, EventConfig, EventWithConfig, EventStats, Racer } from "@/types/events";

export async function getEvents(): Promise<EventWithConfig[]> {
  const supabase = getAdminSupabase();
  const { data: events, error } = await supabase
    .from("live_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  if (!events || events.length === 0) return [];

  const { data: configs } = await supabase
    .from("event_config")
    .select("*")
    .in("event_id", events.map((e) => e.id));

  const configByEvent = new Map<string, EventConfig>();
  for (const config of configs ?? []) {
    configByEvent.set(config.event_id, config as EventConfig);
  }

  return events.map((e) => ({
    ...(e as LiveEvent),
    config: configByEvent.get(e.id) ?? null,
  }));
}

export async function getEvent(slug: string): Promise<EventWithConfig | null> {
  const supabase = getAdminSupabase();
  const { data: event, error } = await supabase
    .from("live_events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !event) return null;

  const { data: config } = await supabase
    .from("event_config")
    .select("*")
    .eq("event_id", event.id)
    .single();

  return {
    ...(event as LiveEvent),
    config: (config as EventConfig) ?? null,
  };
}

export async function createEvent(data: {
  name: string;
  slug: string;
  theme?: string;
  adminPin: string;
}): Promise<LiveEvent> {
  const supabase = getAdminSupabase();

  const { data: event, error } = await supabase
    .from("live_events")
    .insert({
      name: data.name,
      slug: data.slug,
      theme: data.theme ?? null,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const { error: configError } = await supabase.from("event_config").insert({
    event_id: event.id,
    admin_pin: data.adminPin,
    employee_pin: null,
    sms_enabled: false,
    dealer_name: null,
    event_name: data.name,
    track_name: null,
    event_date: null,
    event_time: null,
    logo_left: null,
    logo_right: null,
    logo_3: null,
    logo_4: null,
    waiver_text: null,
  });

  if (configError) throw new Error(configError.message);

  revalidatePath("/events");
  return event as LiveEvent;
}

export async function updateEventConfig(
  eventId: string,
  updates: Partial<EventConfig>
): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("event_config")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);
  revalidatePath("/events");
}

export async function archiveEvent(id: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("live_events")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/events");
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("live_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/events");
}

/* ── Racer management (replaces /api/live-events routes) ────── */

export async function getRacers(eventSlug: string): Promise<Racer[]> {
  const supabase = getAdminSupabase();
  const { data: event } = await supabase
    .from("live_events")
    .select("id")
    .eq("slug", eventSlug)
    .single();

  if (!event) return [];

  const { data: racers } = await supabase
    .from("racers")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  return (racers as Racer[]) ?? [];
}

export async function enterRacerTime(
  eventSlug: string,
  racerId: string,
  lapTime: string
): Promise<void> {
  const supabase = getAdminSupabase();

  const match = lapTime.match(/^(\d+):(\d{2})\.(\d{3})$/);
  if (!match) throw new Error("Invalid lap time format");
  const lapTimeMs =
    parseInt(match[1]) * 60000 + parseInt(match[2]) * 1000 + parseInt(match[3]);

  const { error } = await supabase
    .from("racers")
    .update({
      lap_time: lapTime,
      lap_time_ms: lapTimeMs,
      completed_at: new Date().toISOString(),
    })
    .eq("id", racerId);

  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventSlug}`);
}

export async function deleteRacer(racerId: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("racers").delete().eq("id", racerId);
  if (error) throw new Error(error.message);
}

export async function resetEventRacers(
  eventSlug: string,
  pin: string
): Promise<{ success: boolean }> {
  const supabase = getAdminSupabase();

  const { data: event } = await supabase
    .from("live_events")
    .select("id")
    .eq("slug", eventSlug)
    .single();

  if (!event) return { success: false };

  const { data: config } = await supabase
    .from("event_config")
    .select("admin_pin")
    .eq("event_id", event.id)
    .single();

  if (!config || config.admin_pin !== pin) return { success: false };

  await supabase.from("racers").delete().eq("event_id", event.id);
  revalidatePath(`/events/${eventSlug}`);
  return { success: true };
}

export async function getEventStats(eventId: string): Promise<EventStats> {
  const supabase = getAdminSupabase();

  const { count: totalRacers } = await supabase
    .from("racers")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { count: inQueue } = await supabase
    .from("racers")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .is("lap_time", null);

  const { count: completed } = await supabase
    .from("racers")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .not("lap_time", "is", null);

  return {
    totalRacers: totalRacers ?? 0,
    inQueue: inQueue ?? 0,
    completed: completed ?? 0,
  };
}
