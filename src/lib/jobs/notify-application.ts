import { Resend } from 'resend'
import { buildEmailHtml } from '@/lib/email-template'

/* ── Config ────────────────────────────────────────── */

const TELNYX_API_URL = 'https://api.telnyx.com/v2/messages'
const JOBS_EMAIL = 'hi+jobs@simsforhire.com'

/* ── Types ─────────────────────────────────────────── */

export interface ApplicationNotifyData {
  readonly applicantName: string
  readonly applicantEmail: string
  readonly applicantPhone: string
  readonly jobTitle: string
  readonly instagram: string
  readonly aboutMe: string
}

/* ── SMS via Telnyx ────────────────────────────────── */

/**
 * Send an SMS auto-reply to the applicant confirming receipt,
 * and a lead-details SMS to the admin number.
 */
export async function sendApplicationSms(
  data: ApplicationNotifyData
): Promise<void> {
  const apiKey = process.env.TELNYX_API_KEY
  const fromNumber = process.env.TELNYX_PHONE_NUMBER
  const adminNumber = process.env.TELNYX_TO_NUMBER

  if (!apiKey || !fromNumber) {
    console.warn('[sendApplicationSms] Telnyx not configured — skipping SMS')
    return
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  // 1. Auto-reply to applicant
  const applicantMsg =
    `Hey ${data.applicantName.split(' ')[0]}! 🏁 Thanks for applying to "${data.jobTitle}" at SimsForHire. ` +
    `We've received your application and will review it shortly. Stay tuned!`

  const autoReplyRes = await fetch(TELNYX_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: fromNumber,
      to: data.applicantPhone,
      text: applicantMsg,
    }),
  })

  if (!autoReplyRes.ok) {
    console.error('[sendApplicationSms] auto-reply failed:', await autoReplyRes.text())
  }

  // 2. Resume details to admin
  if (adminNumber) {
    const resumeMsg =
      `📄 New Resume Received!\n` +
      `Position: ${data.jobTitle}\n` +
      `Name: ${data.applicantName}\n` +
      `Email: ${data.applicantEmail}\n` +
      `Phone: ${data.applicantPhone}\n` +
      `IG: ${data.instagram}`

    const resumeRes = await fetch(TELNYX_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: fromNumber,
        to: adminNumber,
        text: resumeMsg,
      }),
    })

    if (!resumeRes.ok) {
      console.error('[sendApplicationSms] resume SMS failed:', await resumeRes.text())
    }
  }
}

/* ── Email via Resend ──────────────────────────────── */

/**
 * Send an email notification to the jobs inbox with the applicant summary.
 */
export async function sendApplicationEmail(
  data: ApplicationNotifyData
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[sendApplicationEmail] Resend not configured — skipping email')
    return
  }

  const resend = new Resend(apiKey)
  const from = process.env.RESEND_FROM_EMAIL ?? 'SimsForHire <hello@simsforhire.com>'

  const bodyHtml = `
    <p><strong>New application received for "${data.jobTitle}"</strong></p>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(data.applicantName)}</li>
      <li><strong>Email:</strong> ${escapeHtml(data.applicantEmail)}</li>
      <li><strong>Phone:</strong> ${escapeHtml(data.applicantPhone)}</li>
      <li><strong>Instagram:</strong> ${escapeHtml(data.instagram)}</li>
    </ul>
    <p><strong>About:</strong></p>
    <p>${escapeHtml(data.aboutMe)}</p>
  `

  const html = buildEmailHtml(bodyHtml, null)

  const { error } = await resend.emails.send({
    from,
    to: JOBS_EMAIL,
    subject: `New Application: ${data.jobTitle} — ${data.applicantName}`,
    html,
  })

  if (error) {
    console.error('[sendApplicationEmail] Resend error:', error.message)
  }
}

/* ── Helpers ───────────────────────────────────────── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
