"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAdminSupabase } from "@/lib/supabase-admin";

/* ── Types ──────────────────────────────────────────────────── */

export interface QrRedirect {
  token: string;
  destination_url: string;
  event_id: string | null;
  label: string | null;
  scan_count: number;
  is_universal: boolean;
  created_at: string;
  updated_at: string;
}

export interface QrRedirectWithEvent extends QrRedirect {
  event_name: string | null;
  event_slug: string | null;
}

/* ── Token generation ───────────────────────────────────────── */

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 8-char base62 token, ~218 trillion combinations. Server-side only. */
function generateToken(): string {
  // Use crypto.getRandomValues for unbiased uniform sampling.
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

/* ── URL helpers ────────────────────────────────────────────── */

/** Build the absolute URL a printed QR will encode for a given token. */
export async function buildTokenUrl(token: string): Promise<string> {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/qr/${token}`;
}

/* ── Read ───────────────────────────────────────────────────── */

export async function listQrRedirects(): Promise<QrRedirectWithEvent[]> {
  const supabase = getAdminSupabase();
  const { data: redirects } = await supabase
    .from("qr_redirects")
    .select("*")
    .order("is_universal", { ascending: false })
    .order("created_at", { ascending: false });

  if (!redirects || redirects.length === 0) return [];

  const eventIds = Array.from(
    new Set(
      redirects
        .map((r) => r.event_id as string | null)
        .filter((id): id is string => Boolean(id))
    )
  );

  const eventMap = new Map<string, { name: string; slug: string }>();
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("live_events")
      .select("id,name,slug")
      .in("id", eventIds);
    for (const e of events ?? []) {
      eventMap.set(e.id as string, {
        name: e.name as string,
        slug: e.slug as string,
      });
    }
  }

  return redirects.map((r) => {
    const ev = r.event_id ? eventMap.get(r.event_id as string) : undefined;
    return {
      token: r.token as string,
      destination_url: r.destination_url as string,
      event_id: (r.event_id as string | null) ?? null,
      label: (r.label as string | null) ?? null,
      scan_count: (r.scan_count as number) ?? 0,
      is_universal: Boolean(r.is_universal),
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      event_name: ev?.name ?? null,
      event_slug: ev?.slug ?? null,
    };
  });
}

/** Returns the universal QR (always exactly one). Lazy-creates if missing. */
export async function getUniversalQr(): Promise<QrRedirectWithEvent> {
  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("qr_redirects")
    .select("*")
    .eq("is_universal", true)
    .maybeSingle();

  let row = existing;
  if (!row) {
    const { data: created } = await supabase
      .from("qr_redirects")
      .insert({
        token: "GENERAL1",
        destination_url: "/events",
        label: "General QR (universal)",
        is_universal: true,
      })
      .select("*")
      .single();
    row = created;
  }

  const eventId = (row?.event_id as string | null) ?? null;
  let eventName: string | null = null;
  let eventSlug: string | null = null;
  if (eventId) {
    const { data: event } = await supabase
      .from("live_events")
      .select("name,slug")
      .eq("id", eventId)
      .single();
    eventName = (event?.name as string | null) ?? null;
    eventSlug = (event?.slug as string | null) ?? null;
  }

  return {
    token: row!.token as string,
    destination_url: row!.destination_url as string,
    event_id: eventId,
    label: (row!.label as string | null) ?? null,
    scan_count: (row!.scan_count as number) ?? 0,
    is_universal: true,
    created_at: row!.created_at as string,
    updated_at: row!.updated_at as string,
    event_name: eventName,
    event_slug: eventSlug,
  };
}

/** Find the primary (event-linked) QR for a given event, if any. */
export async function getPrimaryQrForEvent(
  eventId: string
): Promise<QrRedirect | null> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("qr_redirects")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_universal", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    token: data.token as string,
    destination_url: data.destination_url as string,
    event_id: (data.event_id as string | null) ?? null,
    label: (data.label as string | null) ?? null,
    scan_count: (data.scan_count as number) ?? 0,
    is_universal: false,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/* ── Create ─────────────────────────────────────────────────── */

/** Create a redirect and return the token. Retries on token collision. */
export async function createQrRedirect(input: {
  destinationUrl: string;
  eventId?: string | null;
  label?: string | null;
}): Promise<QrRedirect> {
  if (!input.destinationUrl.trim()) {
    throw new Error("Destination URL is required");
  }
  const supabase = getAdminSupabase();
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateToken();
    const { data, error } = await supabase
      .from("qr_redirects")
      .insert({
        token,
        destination_url: input.destinationUrl.trim(),
        event_id: input.eventId ?? null,
        label: input.label ?? null,
        is_universal: false,
      })
      .select("*")
      .single();
    if (!error && data) {
      revalidatePath("/qr-codes");
      if (input.eventId) revalidatePath(`/events/${input.eventId}`);
      return {
        token: data.token as string,
        destination_url: data.destination_url as string,
        event_id: (data.event_id as string | null) ?? null,
        label: (data.label as string | null) ?? null,
        scan_count: (data.scan_count as number) ?? 0,
        is_universal: false,
        created_at: data.created_at as string,
        updated_at: data.updated_at as string,
      };
    }
    // Unique-violation on token (PG 23505) → retry with a new token
    if (error?.code !== "23505") throw new Error(error?.message ?? "Insert failed");
  }
  throw new Error("Token collision after 5 attempts (extremely unlikely)");
}

/* ── Update ─────────────────────────────────────────────────── */

export async function updateQrRedirect(
  token: string,
  updates: { destinationUrl?: string; label?: string | null }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    updates.destinationUrl !== undefined &&
    !updates.destinationUrl.trim()
  ) {
    return { ok: false, error: "Destination URL cannot be empty" };
  }
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.destinationUrl !== undefined) patch.destination_url = updates.destinationUrl.trim();
  if (updates.label !== undefined) patch.label = updates.label;

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("qr_redirects")
    .update(patch)
    .eq("token", token);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/qr-codes");
  revalidatePath("/events");
  return { ok: true };
}

/** Convenience: re-point the universal QR at a specific event. */
export async function pointUniversalAtEvent(
  eventId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data: event } = await supabase
    .from("live_events")
    .select("slug,name")
    .eq("id", eventId)
    .single();
  if (!event) return { ok: false, error: "Event not found" };

  const { error } = await supabase
    .from("qr_redirects")
    .update({
      destination_url: `/waiver/${event.slug}`,
      event_id: eventId,
      label: `General QR → ${event.name}`,
      updated_at: new Date().toISOString(),
    })
    .eq("is_universal", true);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/qr-codes");
  revalidatePath(`/events/${event.slug}`);
  return { ok: true };
}

/* ── Delete ─────────────────────────────────────────────────── */

export async function deleteQrRedirect(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  // Guard: never delete the universal QR.
  const { data: row } = await supabase
    .from("qr_redirects")
    .select("is_universal")
    .eq("token", token)
    .single();
  if (row?.is_universal) {
    return { ok: false, error: "The General QR cannot be deleted" };
  }
  const { error } = await supabase
    .from("qr_redirects")
    .delete()
    .eq("token", token);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/qr-codes");
  revalidatePath("/events");
  return { ok: true };
}
