import { Resend } from 'resend'
import type { ContactFormData } from './validate'
import type { LeaseFormData } from './validate-lease'

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

const LEADS_EMAIL_FALLBACK = 'hi+leads@simsforhire.com'

// ─── Shared HTML pieces ───

const LOGO_URL = 'https://simsforhire.com/images/simsforhire-logo-white.png'

function brandedHeader(): string {
  return `
    <div style="background: #0A0A0A; padding: 24px 32px; text-align: center; border-bottom: 3px solid #E10600;">
      <img src="${LOGO_URL}" alt="SimsForHire" style="height: 36px; width: auto;" />
    </div>
  `
}

function brandedFooter(): string {
  return `
    <div style="background: #0A0A0A; padding: 28px 32px; border-top: 1px solid #222;">
      <table style="width: 100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 6px; font-size: 13px; color: #FFF; font-weight: bold; letter-spacing: 1px;">SIMSFORHIRE</p>
            <p style="margin: 0; font-size: 11px; color: #888; line-height: 1.6;">Premium Racing Simulators</p>
            <p style="margin: 0; font-size: 11px; color: #888; line-height: 1.6;">Wynwood, Miami FL</p>
          </td>
          <td style="vertical-align: top; text-align: right;">
            <p style="margin: 0 0 4px;">
              <a href="tel:+17542285654" style="color: #E10600; text-decoration: none; font-size: 14px; font-weight: bold;">(754) 228-5654</a>
            </p>
            <p style="margin: 0 0 4px;">
              <a href="mailto:info@simsforhire.com" style="color: #888; text-decoration: none; font-size: 11px;">info@simsforhire.com</a>
            </p>
            <p style="margin: 0;">
              <a href="https://simsforhire.com" style="color: #E10600; text-decoration: none; font-size: 11px;">simsforhire.com</a>
            </p>
          </td>
        </tr>
      </table>
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #222; text-align: center;">
        <a href="https://instagram.com/simsforhire" style="color: #888; text-decoration: none; font-size: 11px; margin: 0 8px;">Instagram</a>
        <span style="color: #333;">·</span>
        <a href="https://tiktok.com/@simsforhire" style="color: #888; text-decoration: none; font-size: 11px; margin: 0 8px;">TikTok</a>
        <span style="color: #333;">·</span>
        <a href="https://youtube.com/@simsforhire" style="color: #888; text-decoration: none; font-size: 11px; margin: 0 8px;">YouTube</a>
      </div>
    </div>
  `
}

function clientEmailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
    <body style="margin: 0; padding: 0; background: #111; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #0A0A0A;">
        ${brandedHeader()}
        <div style="padding: 32px;">
          ${content}
        </div>
        ${brandedFooter()}
      </div>
    </body>
    </html>
  `
}

// ─── RENT: Client confirmation ───

export async function sendConfirmationEmail(
  data: ContactFormData,
): Promise<void> {
  const client = createResendClient()
  if (!client) return

  const firstName = data.name.split(/\s+/)[0]

  const html = clientEmailWrapper(`
    <h1 style="font-size: 22px; color: #FFF; margin: 0 0 6px; letter-spacing: 1px;">WE GOT YOUR INQUIRY</h1>
    <div style="width: 40px; height: 3px; background: #E10600; margin-bottom: 24px;"></div>

    <p style="color: #CCC; font-size: 14px; line-height: 1.8; margin: 0 0 16px;">
      Hey ${firstName},
    </p>

    <p style="color: #CCC; font-size: 14px; line-height: 1.8; margin: 0 0 16px;">
      Thanks for reaching out! We received your event inquiry and our team is already reviewing it.
      You'll hear back from us within <strong style="color: #FFF;">24 hours</strong>.
    </p>

    ${data.eventType ? `
      <div style="background: #111; border-left: 3px solid #E10600; padding: 16px 20px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #888;">YOUR EVENT</p>
        <p style="margin: 4px 0 0; font-size: 15px; color: #FFF; font-weight: bold;">${data.eventType}${data.eventDate ? ` · ${data.eventDate}` : ''}</p>
        ${data.guestCount ? `<p style="margin: 4px 0 0; font-size: 13px; color: #CCC;">${data.guestCount} expected guests</p>` : ''}
      </div>
    ` : ''}

    <p style="color: #CCC; font-size: 14px; line-height: 1.8; margin: 0 0 16px;">
      We bring full-motion racing simulators to events across Miami — corporate events,
      private parties, brand activations, and more. We handle delivery, setup, operation,
      and teardown so you don't have to worry about a thing.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://simsforhire.com/#events" style="display: inline-block; background: #E10600; color: #FFF; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 2px;">SEE OUR PAST EVENTS</a>
    </div>

    <div style="background: #111; border: 1px solid #222; padding: 20px; margin-top: 24px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Need something urgent?</p>
      <a href="tel:+17542285654" style="color: #E10600; text-decoration: none; font-size: 18px; font-weight: bold;">(754) 228-5654</a>
      <p style="margin: 6px 0 0; font-size: 12px; color: #666;">Available 24/7</p>
    </div>
  `)

  const { error } = await client.resend.emails.send({
    from: client.from,
    to: data.email,
    subject: "We got your inquiry — SimsForHire",
    html,
  })

  if (error) {
    console.error('[Email] Confirmation email failed:', error)
    throw new Error(`Confirmation email failed: ${error.message}`)
  }
}

// ─── RENT: Lead notification to you ───

export async function sendLeadNotificationEmail(
  data: ContactFormData,
): Promise<void> {
  const client = createResendClient()
  if (!client) return

  const leadsEmail = import.meta.env.RESEND_LEADS_EMAIL || LEADS_EMAIL_FALLBACK

  const details = [
    `<strong>Name:</strong> ${data.name}`,
    `<strong>Email:</strong> <a href="mailto:${data.email}" style="color: #E10600;">${data.email}</a>`,
    data.phone ? `<strong>Phone:</strong> <a href="tel:${data.phone}" style="color: #E10600;">${data.phone}</a>` : null,
    data.eventType ? `<strong>Event Type:</strong> ${data.eventType}` : null,
    data.eventDate ? `<strong>Event Date:</strong> ${data.eventDate}` : null,
    data.guestCount ? `<strong>Expected Guests:</strong> ${data.guestCount}` : null,
    `<strong>SMS Consent:</strong> ${data.smsConsent ? 'Yes' : 'No'}`,
  ]
    .filter(Boolean)
    .join('<br/>')

  const { error } = await client.resend.emails.send({
    from: client.from,
    to: leadsEmail,
    subject: `🏁 New Event Lead: ${data.name}${data.eventType ? ` — ${data.eventType}` : ''}`,
    replyTo: data.email,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f9f9f9;">
        <h2 style="margin: 0 0 20px; color: #0A0A0A; font-size: 20px;">🏁 New Event Inquiry</h2>
        <div style="background: #fff; border: 1px solid #e0e0e0; border-left: 4px solid #E10600; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; line-height: 2; color: #333;">${details}</p>
        </div>
        <div style="background: #fff; border: 1px solid #e0e0e0; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px;">Message</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333;">${data.message.replace(/\n/g, '<br/>')}</p>
        </div>
        <p style="font-size: 11px; color: #999; margin: 0;">
          Source: <strong>Event Inquiry Form</strong> · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
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

// ─── LEASE: Client confirmation ───

export async function sendLeaseConfirmationEmail(
  data: LeaseFormData,
): Promise<void> {
  const client = createResendClient()
  if (!client) return

  const firstName = data.name.split(/\s+/)[0]

  const html = clientEmailWrapper(`
    <h1 style="font-size: 22px; color: #FFF; margin: 0 0 6px; letter-spacing: 1px;">LEASE INQUIRY RECEIVED</h1>
    <div style="width: 40px; height: 3px; background: #E10600; margin-bottom: 24px;"></div>

    <p style="color: #CCC; font-size: 14px; line-height: 1.8; margin: 0 0 16px;">
      Hey ${firstName},
    </p>

    <p style="color: #CCC; font-size: 14px; line-height: 1.8; margin: 0 0 16px;">
      Thanks for your interest in leasing a racing simulator! We received your inquiry and
      our team will put together a custom leasing proposal for you.
      Expect to hear back within <strong style="color: #FFF;">24 hours</strong>.
    </p>

    ${data.businessName || data.businessType ? `
      <div style="background: #111; border-left: 3px solid #E10600; padding: 16px 20px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #888;">YOUR BUSINESS</p>
        ${data.businessName ? `<p style="margin: 4px 0 0; font-size: 15px; color: #FFF; font-weight: bold;">${data.businessName}</p>` : ''}
        ${data.businessType ? `<p style="margin: 4px 0 0; font-size: 13px; color: #CCC;">${data.businessType}</p>` : ''}
        ${data.location ? `<p style="margin: 4px 0 0; font-size: 13px; color: #CCC;">${data.location}</p>` : ''}
      </div>
    ` : ''}

    <p style="color: #CCC; font-size: 14px; line-height: 1.8; margin: 0 0 8px;">
      Our monthly leasing programs include:
    </p>
    <ul style="color: #CCC; font-size: 13px; line-height: 2; padding-left: 20px; margin: 0 0 16px;">
      <li>Professional-grade hardware (full-motion & non-motion options)</li>
      <li>Software configuration and tuning</li>
      <li>On-site installation and calibration</li>
      <li>Bi-weekly maintenance and service calls</li>
      <li>Remote diagnostics and support</li>
    </ul>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://simsforhire.com/lease" style="display: inline-block; background: #E10600; color: #FFF; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 2px;">LEARN MORE ABOUT LEASING</a>
    </div>

    <div style="background: #111; border: 1px solid #222; padding: 20px; margin-top: 24px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Need something urgent?</p>
      <a href="tel:+17542285654" style="color: #E10600; text-decoration: none; font-size: 18px; font-weight: bold;">(754) 228-5654</a>
      <p style="margin: 6px 0 0; font-size: 12px; color: #666;">Available 24/7</p>
    </div>
  `)

  const { error } = await client.resend.emails.send({
    from: client.from,
    to: data.email,
    subject: "Lease inquiry received — SimsForHire",
    html,
  })

  if (error) {
    console.error('[Email] Lease confirmation failed:', error)
    throw new Error(`Lease confirmation failed: ${error.message}`)
  }
}

// ─── LEASE: Lead notification to you ───

export async function sendLeaseNotificationEmail(
  data: LeaseFormData,
): Promise<void> {
  const client = createResendClient()
  if (!client) return

  const leadsEmail = import.meta.env.RESEND_LEADS_EMAIL || LEADS_EMAIL_FALLBACK

  const details = [
    `<strong>Name:</strong> ${data.name}`,
    `<strong>Email:</strong> <a href="mailto:${data.email}" style="color: #E10600;">${data.email}</a>`,
    data.phone ? `<strong>Phone:</strong> <a href="tel:${data.phone}" style="color: #E10600;">${data.phone}</a>` : null,
    data.businessName ? `<strong>Business:</strong> ${data.businessName}` : null,
    data.businessType ? `<strong>Type:</strong> ${data.businessType}` : null,
    data.location ? `<strong>Location:</strong> ${data.location}` : null,
    `<strong>SMS Consent:</strong> ${data.smsConsent ? 'Yes' : 'No'}`,
  ]
    .filter(Boolean)
    .join('<br/>')

  const { error } = await client.resend.emails.send({
    from: client.from,
    to: leadsEmail,
    subject: `🏢 New Lease Lead: ${data.name}${data.businessName ? ` — ${data.businessName}` : ''}`,
    replyTo: data.email,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f9f9f9;">
        <h2 style="margin: 0 0 20px; color: #0A0A0A; font-size: 20px;">🏢 New Lease Inquiry</h2>
        <div style="background: #fff; border: 1px solid #e0e0e0; border-left: 4px solid #E10600; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; line-height: 2; color: #333;">${details}</p>
        </div>
        <div style="background: #fff; border: 1px solid #e0e0e0; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px;">Message</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333;">${(data.message || 'No message').replace(/\n/g, '<br/>')}</p>
        </div>
        <p style="font-size: 11px; color: #999; margin: 0;">
          Source: <strong>Lease Form</strong> · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
          <br/>Reply to this email to respond directly to ${data.name}.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[Email] Lease notification failed:', error)
    throw new Error(`Lease notification failed: ${error.message}`)
  }
}

// ─── POPUP: Client confirmation ───

export async function sendPopupConfirmationEmail(
  data: { name?: string; email: string; interest?: string },
): Promise<void> {
  const client = createResendClient()
  if (!client) return

  const firstName = data.name?.split(/\s+/)[0] || 'there'

  const html = clientEmailWrapper(`
    <h1 style="font-size: 22px; color: #FFF; margin: 0 0 6px; letter-spacing: 1px;">THANKS FOR YOUR INTEREST</h1>
    <div style="width: 40px; height: 3px; background: #E10600; margin-bottom: 24px;"></div>

    <p style="color: #CCC; font-size: 14px; line-height: 1.8; margin: 0 0 16px;">
      Hey ${firstName},
    </p>

    <p style="color: #CCC; font-size: 14px; line-height: 1.8; margin: 0 0 16px;">
      We got your info and our team will be in touch within <strong style="color: #FFF;">24 hours</strong>
      to discuss how we can help${data.interest ? ` with <strong style="color: #E10600;">${data.interest.toLowerCase()}</strong>` : ''}.
    </p>

    <p style="color: #CCC; font-size: 14px; line-height: 1.8; margin: 0 0 16px;">
      SimsForHire provides full-motion racing simulators for events, monthly leasing for businesses,
      and turnkey simulator sales. Whatever you need — we've got you covered.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://simsforhire.com" style="display: inline-block; background: #E10600; color: #FFF; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 2px;">VISIT SIMSFORHIRE.COM</a>
    </div>

    <div style="background: #111; border: 1px solid #222; padding: 20px; margin-top: 24px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Need something urgent?</p>
      <a href="tel:+17542285654" style="color: #E10600; text-decoration: none; font-size: 18px; font-weight: bold;">(754) 228-5654</a>
      <p style="margin: 6px 0 0; font-size: 12px; color: #666;">Available 24/7</p>
    </div>
  `)

  const { error } = await client.resend.emails.send({
    from: client.from,
    to: data.email,
    subject: "Thanks for your interest — SimsForHire",
    html,
  })

  if (error) {
    console.error('[Email] Popup confirmation failed:', error)
    throw new Error(`Popup confirmation failed: ${error.message}`)
  }
}

// ─── POPUP: Lead notification to you ───

export async function sendPopupNotificationEmail(
  data: { name?: string; email: string; phone?: string; interest?: string; sourcePage?: string },
): Promise<void> {
  const client = createResendClient()
  if (!client) return

  const leadsEmail = import.meta.env.RESEND_LEADS_EMAIL || LEADS_EMAIL_FALLBACK

  const details = [
    data.name ? `<strong>Name:</strong> ${data.name}` : null,
    `<strong>Email:</strong> <a href="mailto:${data.email}" style="color: #E10600;">${data.email}</a>`,
    data.phone ? `<strong>Phone:</strong> <a href="tel:${data.phone}" style="color: #E10600;">${data.phone}</a>` : null,
    data.interest ? `<strong>Interest:</strong> ${data.interest}` : null,
    data.sourcePage ? `<strong>Page:</strong> ${data.sourcePage}` : null,
  ]
    .filter(Boolean)
    .join('<br/>')

  const { error } = await client.resend.emails.send({
    from: client.from,
    to: leadsEmail,
    subject: `⏱️ Popup Lead: ${data.name || data.email}${data.interest ? ` — ${data.interest}` : ''}`,
    replyTo: data.email,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f9f9f9;">
        <h2 style="margin: 0 0 20px; color: #0A0A0A; font-size: 20px;">⏱️ Popup Lead (60s engagement)</h2>
        <div style="background: #fff; border: 1px solid #e0e0e0; border-left: 4px solid #E10600; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; line-height: 2; color: #333;">${details}</p>
        </div>
        <p style="font-size: 11px; color: #999; margin: 0;">
          Source: <strong>Timed Popup</strong> · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
          <br/>Reply to respond directly to ${data.name || 'this lead'}.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[Email] Popup notification failed:', error)
    throw new Error(`Popup notification failed: ${error.message}`)
  }
}
