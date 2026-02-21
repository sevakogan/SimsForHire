import { Resend } from 'resend'
import type { ContactFormData } from './validate'

export async function sendConfirmationEmail(
  data: ContactFormData,
): Promise<void> {
  const apiKey = import.meta.env.RESEND_API_KEY
  const fromEmail = import.meta.env.RESEND_FROM_EMAIL

  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not set — skipping')
    return
  }

  const resend = new Resend(apiKey)

  // Use Resend's onboarding address if no verified domain yet
  const from = fromEmail || 'SimsForHire <onboarding@resend.dev>'

  const { error } = await resend.emails.send({
    from,
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
          <p style="color: #666; font-size: 12px; margin: 0;">
            SimsForHire — Premium Racing Simulators for Events<br/>
            Miami, FL | hello@simsforhire.com
          </p>
        </div>
      </div>
    `,
  })

  if (error) {
    console.error('[Email] Resend failed:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
}
