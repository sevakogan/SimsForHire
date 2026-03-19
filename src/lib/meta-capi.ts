import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Meta Conversions API (CAPI) utility
// ---------------------------------------------------------------------------
// Required env vars:
//   META_PIXEL_ID          — your pixel ID
//   META_CAPI_ACCESS_TOKEN — System User access token
// ---------------------------------------------------------------------------

const PIXEL_ID = import.meta.env.META_PIXEL_ID ?? ''
const ACCESS_TOKEN = import.meta.env.META_CAPI_ACCESS_TOKEN ?? ''
const API_VERSION = 'v25.0'
const CAPI_URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`

function hashPII(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex')
}

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `1${digits}`
  return digits
}

export interface CAPIUserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  clientIp?: string
  clientUserAgent?: string
  fbc?: string
  fbp?: string
}

export interface CAPIEventOptions {
  eventName: 'Lead' | 'Contact' | 'ViewContent' | string
  eventSourceUrl?: string
  userData: CAPIUserData
  customData?: Record<string, unknown>
  eventId?: string
}

export async function sendCAPIEvent(opts: CAPIEventOptions): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[CAPI] META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set — skipping.')
    return
  }

  const { eventName, eventSourceUrl, userData, customData, eventId } = opts

  const user_data: Record<string, unknown> = {}
  if (userData.email) user_data.em = [hashPII(userData.email)]
  if (userData.phone) user_data.ph = [hashPII(normalisePhone(userData.phone))]
  if (userData.firstName) user_data.fn = [hashPII(userData.firstName)]
  if (userData.lastName) user_data.ln = [hashPII(userData.lastName)]
  if (userData.clientIp) user_data.client_ip_address = userData.clientIp
  if (userData.clientUserAgent) user_data.client_user_agent = userData.clientUserAgent
  if (userData.fbc) user_data.fbc = userData.fbc
  if (userData.fbp) user_data.fbp = userData.fbp

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
        ...(eventId ? { event_id: eventId } : {}),
        user_data,
        ...(customData ? { custom_data: customData } : {}),
      },
    ],
  }

  try {
    const res = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[CAPI] Event "${eventName}" failed ${res.status}:`, body)
    } else {
      const json = await res.json()
      console.log(`[CAPI] Event "${eventName}" sent — events_received: ${json.events_received ?? '?'}`)
    }
  } catch (err) {
    console.error('[CAPI] Network error:', err)
  }
}
