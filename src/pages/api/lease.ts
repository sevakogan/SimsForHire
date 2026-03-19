export const prerender = false

import type { APIRoute } from 'astro'
import { validateLeaseForm } from '../../lib/validate-lease'
import type { LeaseFormData } from '../../lib/validate-lease'
import { sendCAPIEvent } from '../../lib/meta-capi'
import { sendLeaseConfirmationEmail, sendLeaseNotificationEmail } from '../../lib/send-email'
import { saveLead } from '../../lib/save-lead'

async function notifySlackLease(data: LeaseFormData): Promise<void> {
  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[Slack] SLACK_WEBHOOK_URL not set — skipping lease notification')
    return
  }

  const fields = [
    `*Name:* ${data.name}`,
    `*Email:* ${data.email}`,
    data.phone ? `*Phone:* ${data.phone}` : null,
    data.businessName ? `*Business:* ${data.businessName}` : null,
    data.businessType ? `*Type:* ${data.businessType}` : null,
    data.location ? `*Location:* ${data.location}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🏢 New Lease Inquiry', emoji: true },
      },
      { type: 'section', text: { type: 'mrkdwn', text: fields } },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Message:*\n${data.message || '_No message_'}` },
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Source: *Lease Page* | SMS Consent: ${data.smsConsent ? 'Yes' : 'No'}` },
        ],
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Slack responded ${res.status}`)
  }
}

export const POST: APIRoute = async ({ request }) => {
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

  const result = validateLeaseForm(body)
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data } = result

  const rawBody = body as Record<string, unknown>
  const eventId = typeof rawBody.eventId === 'string' ? rawBody.eventId : undefined
  const sourceUrl = typeof rawBody.sourceUrl === 'string' ? rawBody.sourceUrl : undefined
  const fbc = typeof rawBody.fbc === 'string' ? rawBody.fbc : undefined
  const fbp = typeof rawBody.fbp === 'string' ? rawBody.fbp : undefined

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? undefined
  const clientUserAgent = request.headers.get('user-agent') ?? undefined

  const nameParts = (data.name ?? '').trim().split(/\s+/)
  const firstName = nameParts[0] ?? undefined
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

  const notifications: Promise<unknown>[] = [
    notifySlackLease(data),
    sendLeaseConfirmationEmail(data),
    sendLeaseNotificationEmail(data),
    saveLead({
      source: 'lease',
      name: data.name,
      email: data.email,
      phone: data.phone,
      businessName: data.businessName,
      businessType: data.businessType,
      location: data.location,
      message: data.message,
      smsConsent: data.smsConsent,
    }),
    sendCAPIEvent({
      eventName: 'Lead',
      eventSourceUrl: sourceUrl ?? 'https://simsforhire.com/lease',
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
        content_category: 'Lease Inquiry',
        content_name: 'Lease Form',
        lead_event_source: 'Website - Lease Page',
      },
    }),
  ]

  const results = await Promise.allSettled(notifications)

  const labels = ['slack', 'meta-capi']
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      const reason = (results[i] as PromiseRejectedResult).reason
      console.error(`[Lease API] ${labels[i]} failed:`, reason)
    }
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Lease inquiry submitted successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
