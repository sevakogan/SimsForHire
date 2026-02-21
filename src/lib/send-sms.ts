import twilio from 'twilio'
import type { ContactFormData } from './validate'

export async function sendSmsNotification(
  data: ContactFormData,
): Promise<void> {
  const accountSid = import.meta.env.TWILIO_ACCOUNT_SID
  const authToken = import.meta.env.TWILIO_AUTH_TOKEN
  const fromNumber = import.meta.env.TWILIO_FROM_NUMBER
  const toNumber = import.meta.env.TWILIO_TO_NUMBER

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    console.warn('[SMS] Twilio env vars not set — skipping')
    return
  }

  const client = twilio(accountSid, authToken)

  const lines = [
    `🏁 New SimsForHire Inquiry`,
    ``,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    data.eventType ? `Type: ${data.eventType}` : null,
    data.eventDate ? `Date: ${data.eventDate}` : null,
    data.guestCount ? `Guests: ${data.guestCount}` : null,
    ``,
    `Message: ${data.message.slice(0, 300)}${data.message.length > 300 ? '...' : ''}`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  await client.messages.create({
    body: lines,
    from: fromNumber,
    to: toNumber,
  })
}
