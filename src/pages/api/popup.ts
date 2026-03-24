export const prerender = false

import type { APIRoute } from 'astro'
import { sendCAPIEvent } from '../../lib/meta-capi'
import { sendPopupConfirmationEmail, sendPopupNotificationEmail } from '../../lib/send-email'
import { saveLead } from '../../lib/save-lead'

async function notifySlackPopup(data: Record<string, string | undefined>): Promise<void> {
  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[Slack] SLACK_WEBHOOK_URL not set — skipping popup notification')
    return
  }

  const fields = [
    `*Name:* ${data.name || '_not provided_'}`,
    `*Email:* ${data.email}`,
    data.phone ? `*Phone:* ${data.phone}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⏱️ Popup Lead (60s engagement)', emoji: true },
      },
      { type: 'section', text: { type: 'mrkdwn', text: fields } },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Interest:* ${data.interest || '_not specified_'}` },
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Source: *Timed Popup* | Page: ${data.sourcePage || 'Unknown'}` },
        ],
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Slack responded ${res.status}`)
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be application/json' }),
      { status: 415, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Valid email is required' }), {
      status: 422, headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = {
    name: typeof body.name === 'string' ? body.name.trim() : undefined,
    email,
    phone: typeof body.phone === 'string' ? body.phone.trim() : undefined,
    interest: typeof body.interest === 'string' ? body.interest.trim() : undefined,
    sourcePage: typeof body.sourcePage === 'string' ? body.sourcePage.trim() : undefined,
  }

  const eventId = typeof body.eventId === 'string' ? body.eventId : undefined
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl : undefined
  const fbc = typeof body.fbc === 'string' ? body.fbc : undefined
  const fbp = typeof body.fbp === 'string' ? body.fbp : undefined

  // Extract UTM fields
  const utmSource = typeof body.utm_source === 'string' ? body.utm_source : undefined
  const utmMedium = typeof body.utm_medium === 'string' ? body.utm_medium : undefined
  const utmCampaign = typeof body.utm_campaign === 'string' ? body.utm_campaign : undefined
  const utmTerm = typeof body.utm_term === 'string' ? body.utm_term : undefined
  const utmContent = typeof body.utm_content === 'string' ? body.utm_content : undefined
  const gclid = typeof body.gclid === 'string' ? body.gclid : undefined
  const fbclid = typeof body.fbclid === 'string' ? body.fbclid : undefined
  const landingPage = typeof body.landingPage === 'string' ? body.landingPage : undefined

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip') ?? undefined
  const clientUserAgent = request.headers.get('user-agent') ?? undefined

  const nameParts = (data.name ?? '').trim().split(/\s+/)

  const notifications: Promise<unknown>[] = [
    notifySlackPopup(data),
    sendPopupConfirmationEmail({ name: data.name, email: data.email, interest: data.interest }),
    sendPopupNotificationEmail(data),
    saveLead({
      source: 'popup',
      name: data.name,
      email: data.email,
      phone: data.phone,
      interest: data.interest,
      sourcePage: data.sourcePage,
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
        email: data.email,
        phone: data.phone,
        firstName: nameParts[0] ?? undefined,
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined,
        clientIp,
        clientUserAgent,
        fbc,
        fbp,
      },
      customData: {
        content_category: 'Popup Lead',
        content_name: 'Timed Popup Form',
        lead_event_source: 'Website - Popup',
      },
    }),
  ]

  await Promise.allSettled(notifications)

  return new Response(
    JSON.stringify({ success: true, message: 'Thanks! We\'ll be in touch.' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
