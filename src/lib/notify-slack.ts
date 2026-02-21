import type { ContactFormData } from './validate'

export async function notifySlack(data: ContactFormData): Promise<void> {
  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('[Slack] SLACK_WEBHOOK_URL not set — skipping notification')
    return
  }

  const fields = [
    `*Name:* ${data.name}`,
    `*Email:* ${data.email}`,
    data.phone ? `*Phone:* ${data.phone}` : null,
    data.eventType ? `*Event Type:* ${data.eventType}` : null,
    data.eventDate ? `*Event Date:* ${data.eventDate}` : null,
    data.guestCount ? `*Expected Guests:* ${data.guestCount}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🏁 New Event Inquiry',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: fields,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n>${data.message.replace(/\n/g, '\n>')}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Submitted via simsforhire.com • ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`,
          },
        ],
      },
    ],
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    console.error('[Slack] Webhook failed:', response.status)
    throw new Error(`Slack notification failed: ${response.status}`)
  }
}
