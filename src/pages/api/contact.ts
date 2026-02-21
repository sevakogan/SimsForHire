export const prerender = false

import type { APIRoute } from 'astro'
import { validateContactForm } from '../../lib/validate'
import { notifySlack } from '../../lib/notify-slack'
import { sendConfirmationEmail } from '../../lib/send-email'
import { sendSmsNotification } from '../../lib/send-sms'

export const POST: APIRoute = async ({ request }) => {
  // Rate-limit header check (Vercel provides client IP)
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

  // Validate
  const result = validateContactForm(body)
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data } = result

  // Fire all three notifications concurrently
  // We use allSettled so one failure doesn't block the others
  const [slackResult, emailResult, smsResult] = await Promise.allSettled([
    notifySlack(data),
    sendConfirmationEmail(data),
    sendSmsNotification(data),
  ])

  // Log any failures (but still return 200 to the user)
  const failures: string[] = []

  if (slackResult.status === 'rejected') {
    console.error('[API] Slack failed:', slackResult.reason)
    failures.push('slack')
  }
  if (emailResult.status === 'rejected') {
    console.error('[API] Email failed:', emailResult.reason)
    failures.push('email')
  }
  if (smsResult.status === 'rejected') {
    console.error('[API] SMS failed:', smsResult.reason)
    failures.push('sms')
  }

  // Return success to user regardless (their submission was received)
  // Only fail if ALL three notifications failed
  if (failures.length === 3) {
    return new Response(
      JSON.stringify({
        error: 'Failed to process submission. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Inquiry submitted successfully',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
