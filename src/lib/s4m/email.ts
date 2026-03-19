import sgMail from '@sendgrid/mail'

const FROM_NAME = 'Sims For Hire'

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
) {
  const apiKey = import.meta.env.SENDGRID_API_KEY
  const fromEmail = import.meta.env.SENDGRID_FROM_EMAIL || 'hi@simsforhire.com'

  if (!apiKey) {
    console.warn('[Email] SENDGRID_API_KEY not set, skipping email to', to)
    return { ok: false, error: 'SendGrid not configured' }
  }

  try {
    sgMail.setApiKey(apiKey)

    const msg: sgMail.MailDataRequired = {
      to,
      from: { email: fromEmail, name: FROM_NAME },
      replyTo: { email: fromEmail, name: FROM_NAME },
      subject,
      html,
    }

    if (text) {
      msg.text = text
    }

    await sgMail.send(msg)
    console.log(`[Email] Sent "${subject}" to ${to}`)
    return { ok: true }
  } catch (err: unknown) {
    const sgError = err as { response?: { body?: { errors?: Array<{ message: string }> } } }
    const details = sgError?.response?.body?.errors
      ?.map((e) => e.message)
      .join('; ')

    const errorMessage = details || (err instanceof Error ? err.message : 'Unknown email error')
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, errorMessage)
    return { ok: false, error: errorMessage }
  }
}
