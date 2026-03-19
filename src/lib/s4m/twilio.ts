import twilio from 'twilio'

export async function sendSMS(to: string, message: string) {
  const sid = import.meta.env.TWILIO_ACCOUNT_SID
  const token = import.meta.env.TWILIO_AUTH_TOKEN
  const from = import.meta.env.TWILIO_PHONE_NUMBER

  if (!sid || !token || !from) {
    console.warn('[SMS] Twilio not configured, skipping SMS to', to)
    return { ok: false, error: 'Twilio not configured' }
  }

  try {
    const client = twilio(sid, token)
    await client.messages.create({ body: message, from, to })
    return { ok: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[SMS] Error:', errorMessage)
    return { ok: false, error: errorMessage }
  }
}
