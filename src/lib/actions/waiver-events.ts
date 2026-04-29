"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { buildWaiverEmail } from "@/lib/email-template";
import { generateWaiverPdf } from "@/lib/waiver-pdf";
import { sendCAPIEvent } from "@/lib/meta-capi";
import { createQrRedirect } from "@/lib/actions/qr-redirects";
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

  // Auto-create a dedicated QR redirect for this event. Failure is logged
  // but not fatal — the event still works without the dynamic QR.
  try {
    await createQrRedirect({
      destinationUrl: `/waiver/${data.slug}`,
      eventId: event.id as string,
      label: data.name,
    });
  } catch (err) {
    console.error("[waiver-event] failed to create dedicated QR:", err);
  }

  revalidatePath("/events");
  revalidatePath("/qr-codes");
  return event as LiveEvent;
}

/** Update the editable display name (event_config.event_name). Slug is immutable. */
export async function updateWaiverDisplayName(
  eventId: string,
  displayName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = displayName.trim();
  if (!trimmed) return { ok: false, error: "Display name cannot be empty" };
  if (trimmed.length > 200) return { ok: false, error: "Display name too long" };

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("event_config")
    .update({ event_name: trimmed, updated_at: new Date().toISOString() })
    .eq("event_id", eventId);

  if (error) return { ok: false, error: error.message };

  // Get slug for revalidation of the public page
  const { data: event } = await supabase
    .from("live_events")
    .select("slug")
    .eq("id", eventId)
    .single();
  if (event?.slug) revalidatePath(`/waiver/${event.slug}`);
  revalidatePath(`/events/${event?.slug ?? ""}`);
  revalidatePath("/events");
  return { ok: true };
}

/** Delete a single waiver-signer row. Returns the slug of the affected event so
 *  callers can revalidate or update local state. */
export async function deleteSigner(
  signerId: string
): Promise<{ ok: true; eventSlug: string | null } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();

  // Look up event slug for revalidation BEFORE deleting (cascade-safe order).
  const { data: signer } = await supabase
    .from("racers")
    .select("event_id")
    .eq("id", signerId)
    .single();

  let eventSlug: string | null = null;
  if (signer?.event_id) {
    const { data: event } = await supabase
      .from("live_events")
      .select("slug")
      .eq("id", signer.event_id as string)
      .single();
    eventSlug = (event?.slug as string | null) ?? null;
  }

  const { error } = await supabase.from("racers").delete().eq("id", signerId);
  if (error) return { ok: false, error: error.message };

  if (eventSlug) revalidatePath(`/events/${eventSlug}`);
  revalidatePath("/signers");
  return { ok: true, eventSlug };
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

export interface SignerWithEvent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  waiver_version: number | null;
  waiver_accepted_at: string | null;
  waiver_accepted_ip: string | null;
  waiver_accepted_user_agent: string | null;
  signature_data_url: string | null;
  event_id: string;
  event_name: string;
  event_slug: string;
  email_sent_at: string | null;
  email_opened_at: string | null;
  email_open_count: number | null;
  email_open_user_agent: string | null;
}

/** All waiver signers across every event (most recent first). */
export async function listAllSigners(): Promise<SignerWithEvent[]> {
  const supabase = getAdminSupabase();
  // Foreign-table syntax requires a relationship; use two queries + in-memory join.
  const { data: signers } = await supabase
    .from("racers")
    .select(
      "id,name,email,phone,marketing_opt_in,waiver_version,waiver_accepted_at,waiver_accepted_ip,waiver_accepted_user_agent,signature_data_url,event_id,email_sent_at,email_opened_at,email_open_count,email_open_user_agent"
    )
    .not("waiver_version", "is", null)
    .order("waiver_accepted_at", { ascending: false });

  if (!signers || signers.length === 0) return [];

  const eventIds = Array.from(new Set(signers.map((s) => s.event_id as string)));
  const { data: events } = await supabase
    .from("live_events")
    .select("id,name,slug")
    .in("id", eventIds);

  const eventMap = new Map<string, { name: string; slug: string }>();
  for (const e of events ?? []) {
    eventMap.set(e.id as string, { name: e.name as string, slug: e.slug as string });
  }

  return signers.map((s) => {
    const event = eventMap.get(s.event_id as string);
    return {
      id: s.id as string,
      name: s.name as string,
      email: (s.email as string | null) ?? null,
      phone: (s.phone as string | null) ?? null,
      marketing_opt_in: Boolean(s.marketing_opt_in),
      waiver_version: (s.waiver_version as number | null) ?? null,
      waiver_accepted_at: (s.waiver_accepted_at as string | null) ?? null,
      waiver_accepted_ip: (s.waiver_accepted_ip as string | null) ?? null,
      waiver_accepted_user_agent: (s.waiver_accepted_user_agent as string | null) ?? null,
      signature_data_url: (s.signature_data_url as string | null) ?? null,
      event_id: s.event_id as string,
      event_name: event?.name ?? "(deleted event)",
      event_slug: event?.slug ?? "",
      email_sent_at: (s.email_sent_at as string | null) ?? null,
      email_opened_at: (s.email_opened_at as string | null) ?? null,
      email_open_count: (s.email_open_count as number | null) ?? null,
      email_open_user_agent: (s.email_open_user_agent as string | null) ?? null,
    };
  });
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
  phone: string; // optional — empty string accepted
  email: string;
  waiverVersion: number;
  marketingOptIn: boolean;
  signatureDataUrl: string;
  /** Matched with the client-side fbq eventID for Meta deduplication. */
  eventId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const signature = input.signatureDataUrl;

  if (!name || !email) {
    return { ok: false, error: "Name and email are required" };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Invalid email address" };
  }
  if (!signature || !signature.startsWith("data:image/")) {
    return { ok: false, error: "Signature is required" };
  }
  // Reject suspiciously huge signatures (>2MB base64 ≈ unsigned drawn data)
  if (signature.length > 2_000_000) {
    return { ok: false, error: "Signature image too large" };
  }

  const supabase = getAdminSupabase();

  const { data: event } = await supabase
    .from("live_events")
    .select("id, name, event_type")
    .eq("slug", input.eventSlug)
    .single();

  if (!event || event.event_type !== "waiver") {
    return { ok: false, error: "Event not found" };
  }

  const { data: config } = await supabase
    .from("event_config")
    .select("dealer_name")
    .eq("event_id", event.id)
    .single();
  const dealerName = (config?.dealer_name as string | null) ?? "Sims For Hire";

  // Snapshot the exact waiver text the signer accepted (for the email copy)
  const { data: waiverRow } = await supabase
    .from("event_waiver_versions")
    .select("body")
    .eq("event_id", event.id)
    .eq("version", input.waiverVersion)
    .single();

  const hdrs = await headers();
  const forwardedFor = hdrs.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  const userAgent = hdrs.get("user-agent") ?? "";
  const signedAt = new Date();

  const { data: inserted, error } = await supabase
    .from("racers")
    .insert({
      event_id: event.id,
      name,
      phone: phone || null,
      email,
      queue_pos: null,
      lap_time: null,
      lap_time_ms: null,
      sms_sent: false,
      sms_status: null,
      waiver_version: input.waiverVersion,
      waiver_accepted_at: signedAt.toISOString(),
      waiver_accepted_ip: ip,
      waiver_accepted_user_agent: userAgent,
      signature_data_url: signature,
      marketing_opt_in: input.marketingOptIn,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  // Fire CAPI conversion events — wrapped so a failure never blocks the response.
  const eventSourceUrl = `https://simsforhire.com/waiver/${input.eventSlug}`;
  const nameParts = name.trim().split(" ");
  const capiUserData = {
    email,
    phone: phone || undefined,
    firstName: nameParts[0],
    lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined,
  };
  Promise.all([
    sendCAPIEvent({
      eventName: "Lead",
      eventSourceUrl,
      userData: capiUserData,
      eventId: input.eventId ? `lead-${input.eventId}` : undefined,
    }),
    sendCAPIEvent({
      eventName: "CompleteRegistration",
      eventSourceUrl,
      userData: capiUserData,
      eventId: input.eventId,
      customData: { content_name: `${input.eventSlug} waiver` },
    }),
  ]).catch((err) => console.error("[waiver-capi] unexpected error:", err));

  // Send a copy to the signer (Florida E-SIGN: signer must be able to retain).
  // On success, stamp email_sent_at. On failure, leave it null — the daily
  // drain-waiver-emails cron will retry until it goes through.
  try {
    console.log(
      `[waiver-email] sending copy to ${email} (event=${input.eventSlug}, v${input.waiverVersion}, resend=${process.env.RESEND_API_KEY ? "configured" : "MISSING"})`
    );
    await sendSignedWaiverCopy({
      to: email,
      signerName: name,
      eventName: event.name as string,
      eventSlug: input.eventSlug,
      dealerName,
      waiverVersion: input.waiverVersion,
      waiverBody: waiverRow?.body ?? "",
      signatureDataUrl: signature,
      ip,
      userAgent,
      signedAt,
    });
    console.log(`[waiver-email] OK -> ${email}`);
    await supabase
      .from("racers")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", inserted.id);
  } catch (err) {
    console.error(
      `[waiver-email] FAILED to ${email} (event=${input.eventSlug}) — queued for retry:`,
      err instanceof Error ? `${err.message}\n${err.stack}` : err
    );
  }

  revalidatePath(`/events/${input.eventSlug}`);
  return { ok: true };
}

/* ── Email helper ───────────────────────────────────────────── */

async function sendSignedWaiverCopy(input: {
  to: string;
  signerName: string;
  eventName: string;
  eventSlug: string;
  dealerName: string;
  waiverVersion: number;
  waiverBody: string;
  signatureDataUrl: string;
  ip: string;
  userAgent: string;
  signedAt: Date;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const [html, pdfBuffer] = await Promise.all([
    Promise.resolve(buildWaiverEmail(input.signerName, input.eventName, input.dealerName)),
    generateWaiverPdf({
      name: input.signerName,
      email: input.to,
      signedAt: input.signedAt,
      signedIp: input.ip,
      signedUserAgent: input.userAgent,
      waiverVersion: input.waiverVersion,
      waiverText: input.waiverBody,
      signatureDataUrl: input.signatureDataUrl,
      dealerName: input.dealerName,
      eventName: input.eventName,
      eventSlug: input.eventSlug,
    }),
  ]);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL ?? "SimsForHire <hello@simsforhire.com>";

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Your signed waiver — ${input.eventName}`,
    html,
    attachments: [
      {
        filename: `Waiver-${input.eventSlug}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
