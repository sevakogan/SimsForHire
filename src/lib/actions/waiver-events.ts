"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type {
  EventWaiverVersion,
  LiveEvent,
  Racer,
} from "@/types/events";

/* ── Create ─────────────────────────────────────────────────── */

export async function createWaiverEvent(data: {
  name: string;
  slug: string;
  waiverBody: string;
}): Promise<LiveEvent> {
  if (!data.name.trim() || !data.slug.trim() || !data.waiverBody.trim()) {
    throw new Error("Name, slug, and waiver body are required");
  }

  const supabase = getAdminSupabase();

  const { data: event, error } = await supabase
    .from("live_events")
    .insert({
      name: data.name,
      slug: data.slug,
      theme: null,
      status: "active",
      event_type: "waiver",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  // Minimal config row so existing getEvent join logic still finds something.
  // admin_pin is required by the existing schema; we autogenerate a random one
  // since waiver events don't use a kiosk PIN flow.
  const randomPin = String(Math.floor(1000 + Math.random() * 9000));
  const { error: configError } = await supabase.from("event_config").insert({
    event_id: event.id,
    admin_pin: randomPin,
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

  // Seed v1 of the waiver
  const { error: waiverError } = await supabase
    .from("event_waiver_versions")
    .insert({
      event_id: event.id,
      version: 1,
      body: data.waiverBody,
    });
  if (waiverError) throw new Error(waiverError.message);

  revalidatePath("/events");
  return event as LiveEvent;
}

/* ── Read ───────────────────────────────────────────────────── */

export async function getActiveWaiver(
  eventId: string
): Promise<EventWaiverVersion | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("event_waiver_versions")
    .select("*")
    .eq("event_id", eventId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as EventWaiverVersion;
}

export async function listWaiverVersions(
  eventId: string
): Promise<EventWaiverVersion[]> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("event_waiver_versions")
    .select("*")
    .eq("event_id", eventId)
    .order("version", { ascending: false });
  return (data ?? []) as EventWaiverVersion[];
}

export async function listSigners(eventId: string): Promise<Racer[]> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("racers")
    .select("*")
    .eq("event_id", eventId)
    .not("waiver_version", "is", null)
    .order("waiver_accepted_at", { ascending: false });
  return (data ?? []) as Racer[];
}

/* ── Publish new waiver version (append-only) ───────────────── */

export async function publishWaiverVersion(
  eventId: string,
  body: string
): Promise<EventWaiverVersion> {
  if (!body.trim()) throw new Error("Waiver body cannot be empty");

  const supabase = getAdminSupabase();

  const { data: latest } = await supabase
    .from("event_waiver_versions")
    .select("version")
    .eq("event_id", eventId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = ((latest?.version as number | undefined) ?? 0) + 1;

  const { data, error } = await supabase
    .from("event_waiver_versions")
    .insert({ event_id: eventId, version: nextVersion, body })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  // Get slug to revalidate the public page too
  const { data: event } = await supabase
    .from("live_events")
    .select("slug")
    .eq("id", eventId)
    .single();
  if (event?.slug) revalidatePath(`/waiver/${event.slug}`);
  revalidatePath(`/events`);
  return data as EventWaiverVersion;
}

/* ── Public sign action ─────────────────────────────────────── */

export async function recordWaiverSignature(input: {
  eventSlug: string;
  name: string;
  phone: string;
  email: string;
  waiverVersion: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();

  if (!name || !phone || !email) {
    return { ok: false, error: "Name, phone, and email are required" };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Invalid email address" };
  }

  const supabase = getAdminSupabase();

  // Lookup event by slug — must be a waiver event
  const { data: event } = await supabase
    .from("live_events")
    .select("id, event_type")
    .eq("slug", input.eventSlug)
    .single();

  if (!event || event.event_type !== "waiver") {
    return { ok: false, error: "Event not found" };
  }

  const hdrs = await headers();
  const forwardedFor = hdrs.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  const userAgent = hdrs.get("user-agent") ?? "";

  const { error } = await supabase.from("racers").insert({
    event_id: event.id,
    name,
    phone,
    email,
    queue_pos: null,
    lap_time: null,
    lap_time_ms: null,
    sms_sent: false,
    sms_status: null,
    waiver_version: input.waiverVersion,
    waiver_accepted_at: new Date().toISOString(),
    waiver_accepted_ip: ip,
    waiver_accepted_user_agent: userAgent,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/events/${input.eventSlug}`);
  return { ok: true };
}
