export const prerender = false

import type { APIRoute } from 'astro'
import { validateContactForm } from '../../lib/validate'
import { notifySlack } from '../../lib/notify-slack'
import { sendConfirmationEmail, sendLeadNotificationEmail } from '../../lib/send-email'
import { sendSmsNotification } from '../../lib/send-sms'
import { sendCAPIEvent } from '../../lib/meta-capi'
import { saveLead } from '../../lib/save-lead'

export const POST: APIRoute = async ({ request }) => {
  // Rate-limit header check (Vercel provides client IP)
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be application/json' }),
      { status: 415, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validate
  const result = validateContactForm(body)
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data } = result

  // Extract Meta CAPI fields from the raw body
  const rawBody = body as Record<string, unknown>
  const eventId = typeof rawBody.eventId === 'string' ? rawBody.eventId : undefined
  const sourceUrl = typeof rawBody.sourceUrl === 'string' ? rawBody.sourceUrl : undefined
  const fbc = typeof rawBody.fbc === 'string' ? rawBody.fbc : undefined
  const fbp = typeof rawBody.fbp === 'string' ? rawBody.fbp : undefined

  // Extract UTM fields
  const utmSource = typeof rawBody.utm_source === 'string' ? rawBody.utm_source : undefined
  const utmMedium = typeof rawBody.utm_medium === 'string' ? rawBody.utm_medium : undefined
  const utmCampaign = typeof rawBody.utm_campaign === 'string' ? rawBody.utm_campaign : undefined
  const utmTerm = typeof rawBody.utm_term === 'string' ? rawBody.utm_term : undefined
  const utmContent = typeof rawBody.utm_content === 'string' ? rawBody.utm_content : undefined
  const gclid = typeof rawBody.gclid === 'string' ? rawBody.gclid : undefined
  const fbclid = typeof rawBody.fbclid === 'string' ? rawBody.fbclid : undefined
  const landingPage = typeof rawBody.landingPage === 'string' ? rawBody.landingPage : undefined

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? undefined
  const clientUserAgent = request.headers.get('user-agent') ?? undefined

  // Split name for better Meta match quality
  const nameParts = (data.name ?? '').trim().split(/\s+/)
  const firstName = nameParts[0] ?? undefined
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

  // Fire notifications + Meta CAPI concurrently
  // Only send SMS if user gave explicit consent
  // We use allSettled so one failure doesn't block the others
  const notifications: Promise<unknown>[] = [
    notifySlack(data),
    sendConfirmationEmail(data),
    sendLeadNotificationEmail(data),
    saveLead({
      source: 'rent',
      name: data.name,
      email: data.email,
      phone: data.phone,
      eventType: data.eventType,
      eventDate: data.eventDate,
      guestCount: data.guestCount,
      message: data.message,
      smsConsent: data.smsConsent,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      gclid,
      fbclid,
      landingPage,
    }),
    sendCAPIEvent({
      eventName: 'Lead',
      eventSourceUrl: sourceUrl ?? 'https://simsforhire.com',
      eventId,
      userData: {
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        firstName,
        lastName,
        clientIp,
        clientUserAgent,
        fbc,
        fbp,
      },
      customData: {
        content_category: data.eventType ?? 'General Inquiry',
        content_name: 'Hire Inquiry Form',
        lead_event_source: 'Website',
      },
    }),
  ]
  if (data.smsConsent && data.phone) {
    notifications.push(sendSmsNotification(data))
  }

  const results = await Promise.allSettled(notifications)

  // Log any failures (but still return 200 to the user)
  const labels = ['slack', 'email', 'lead-email', 'save-lead', 'meta-capi', ...(data.smsConsent && data.phone ? ['sms'] : [])]
  const failures: string[] = []

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      const reason = (results[i] as PromiseRejectedResult).reason
      console.error(`[API] ${labels[i]} failed:`, reason)
      failures.push(labels[i])
    }
  }

  // Return success to user regardless (their submission was received)
  // Only fail if ALL notifications failed
  if (failures.length === results.length) {
    return new Response(
      JSON.stringify({
        error: 'Failed to process submission. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Inquiry submitted successfully',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
