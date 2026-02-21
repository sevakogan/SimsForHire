import { Resend } from 'resend'
import type { ContactFormData } from './validate'

function createResendClient(): { resend: Resend; from: string } | null {
  const apiKey = import.meta.env.RESEND_API_KEY
  const fromEmail = import.meta.env.RESEND_FROM_EMAIL

  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not set — skipping')
    return null
  }

  return {
    resend: new Resend(apiKey),
    from: fromEmail || 'SimsForHire <onboarding@resend.dev>',
  }
}

export async function sendConfirmationEmail(
  data: ContactFormData,
): Promise<void> {
  const client = createResendClient()
  if (!client) return

  const { error } = await client.resend.emails.send({
    from: client.from,
    to: data.email,
    subject: 'We got your inquiry — SimsForHire',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0A; color: #FFFFFF; padding: 40px;">
        <div style="border-bottom: 2px solid #E10600; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin: 0; letter-spacing: 2px;">SIMSFORHIRE</h1>
        </div>

        <p style="color: #999; font-size: 14px; line-height: 1.8;">
          Hey ${data.name},
        </p>

        <p style="color: #999; font-size: 14px; line-height: 1.8;">
          Thanks for reaching out! We received your inquiry and our team is already on it. You can expect to hear back from us within <strong style="color: #FFF;">24 hours</strong>.
        </p>

        ${data.eventType ? `<p style="color: #999; font-size: 14px; line-height: 1.8;">We'll put together a custom package for your <strong style="color: #E10600;">${data.eventType}</strong>${data.eventDate ? ` on ${data.eventDate}` : ''}.</p>` : ''}

        <p style="color: #999; font-size: 14px; line-height: 1.8;">
          In the meantime, check out our previous events at <a href="https://simsforhire.com/#events" style="color: #E10600; text-decoration: none;">simsforhire.com</a>.
        </p>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
          <p style="color: #666; font-size: 12px; margin: 0; line-height: 1.8;">
            <strong style="color: #999;">SimsForHire</strong> — Premium Racing Simulators for Events<br/>
            <a href="https://simsforhire.com" style="color: #E10600; text-decoration: none;">simsforhire.com</a><br/>
            <a href="tel:+17542285654" style="color: #999; text-decoration: none;">(754) 228-5654</a><br/>
            Miami, FL | <a href="mailto:hello@simsforhire.com" style="color: #999; text-decoration: none;">hello@simsforhire.com</a>
          </p>
        </div>
      </div>
    `,
  })

  if (error) {
    console.error('[Email] Confirmation email failed:', error)
    throw new Error(`Confirmation email failed: ${error.message}`)
  }
}

export async function sendLeadNotificationEmail(
  data: ContactFormData,
): Promise<void> {
  const client = createResendClient()
  if (!client) return

  const leadsEmail =
    import.meta.env.RESEND_LEADS_EMAIL || 'hi+leads@simsforhire.com'

  const details = [
    `<strong>Name:</strong> ${data.name}`,
    `<strong>Email:</strong> <a href="mailto:${data.email}" style="color: #E10600;">${data.email}</a>`,
    data.phone ? `<strong>Phone:</strong> <a href="tel:${data.phone}" style="color: #E10600;">${data.phone}</a>` : null,
    data.eventType ? `<strong>Event Type:</strong> ${data.eventType}` : null,
    data.eventDate ? `<strong>Event Date:</strong> ${data.eventDate}` : null,
    data.guestCount
      ? `<strong>Expected Guests:</strong> ${data.guestCount}`
      : null,
  ]
    .filter(Boolean)
    .join('<br/>')

  const { error } = await client.resend.emails.send({
    from: client.from,
    to: leadsEmail,
    subject: `New Lead: ${data.name}${data.eventType ? ` — ${data.eventType}` : ''}`,
    replyTo: data.email,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f9f9f9;">
        <h2 style="margin: 0 0 20px; color: #0A0A0A; font-size: 20px;">🏁 New Event Inquiry</h2>

        <div style="background: #fff; border: 1px solid #e0e0e0; border-left: 4px solid #E10600; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; line-height: 2; color: #333;">
            ${details}
          </p>
        </div>

        <div style="background: #fff; border: 1px solid #e0e0e0; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px;">Message</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333;">
            ${data.message.replace(/\n/g, '<br/>')}
          </p>
        </div>

        <p style="font-size: 11px; color: #999; margin: 0;">
          Submitted via simsforhire.com • ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
          <br/>Reply to this email to respond directly to ${data.name}.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[Email] Lead notification failed:', error)
    throw new Error(`Lead notification failed: ${error.message}`)
  }
}
