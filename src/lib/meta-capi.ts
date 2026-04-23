import crypto from "crypto";

/**
 * Meta Conversions API (CAPI) helper — server-side only.
 *
 * Required env vars:
 *   META_PIXEL_ID          — your pixel ID
 *   META_CAPI_ACCESS_TOKEN — System User access token
 *
 * Fires event_name='Purchase' when a lead is marked `booked` in admin,
 * giving Meta's algorithm the real conversion signal (not just form submit).
 */

const PIXEL_ID = process.env.META_PIXEL_ID ?? "";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";
const API_VERSION = "v25.0";
const CAPI_URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

function hashPII(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

export interface CAPIUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface CAPIEventOptions {
  eventName: "Purchase" | "Schedule" | "Lead" | "CompleteRegistration" | string;
  eventSourceUrl?: string;
  userData: CAPIUserData;
  customData?: Record<string, unknown>;
  /** Unique ID for this event — if you also fired the browser Pixel, passing the same ID dedupes. */
  eventId?: string;
  /** In dollars (not cents). */
  value?: number;
  /** ISO 4217, defaults to USD. */
  currency?: string;
}

export async function sendCAPIEvent(opts: CAPIEventOptions): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[CAPI-admin] META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set — skipping.");
    return;
  }

  const { eventName, eventSourceUrl, userData, customData, eventId, value, currency } = opts;

  const user_data: Record<string, unknown> = {};
  if (userData.email) user_data.em = [hashPII(userData.email)];
  if (userData.phone) user_data.ph = [hashPII(normalisePhone(userData.phone))];
  if (userData.firstName) user_data.fn = [hashPII(userData.firstName)];
  if (userData.lastName) user_data.ln = [hashPII(userData.lastName)];

  const mergedCustomData: Record<string, unknown> | undefined =
    value != null || customData
      ? {
          ...(customData ?? {}),
          ...(value != null ? { value, currency: currency ?? "USD" } : {}),
        }
      : undefined;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
        ...(eventId ? { event_id: eventId } : {}),
        user_data,
        ...(mergedCustomData ? { custom_data: mergedCustomData } : {}),
      },
    ],
  };

  try {
    const res = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[CAPI-admin] "${eventName}" failed ${res.status}:`, body);
    } else {
      const json = await res.json();
      console.log(`[CAPI-admin] "${eventName}" sent — events_received: ${json.events_received ?? "?"}`);
    }
  } catch (err) {
    console.error("[CAPI-admin] Network error:", err);
  }
}
