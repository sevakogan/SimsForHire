export const prerender = false
import type { APIRoute } from 'astro'
import { createServiceClient } from '../../../../lib/supabase'
import { resolveEventSlug } from '../../../../lib/s4m/event-helpers'
import { sendSMS } from '../../../../lib/s4m/twilio'
import { sendEmail } from '../../../../lib/s4m/email'
import { registrationEmail, registrationPlainText, getThemeByKey } from '../../../../lib/s4m/email-templates'

export const POST: APIRoute = async ({ params, request }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  const body = await request.json()
  const { name, phone, email } = body as { name?: string; phone?: string; email?: string | null }

  if (!name || !phone) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  const supabase = createServiceClient()

  const { count } = await supabase
    .from('racers')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .is('lap_time', null)

  const queuePos = (count ?? 0) + 1

  const { data, error } = await supabase
    .from('racers')
    .insert({ event_id: eventId, name, phone, email: email || null, queue_pos: queuePos })
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Fetch event config + theme
  const [{ data: config }, { data: eventData }] = await Promise.all([
    supabase.from('event_config')
      .select('dealer_name, event_name, sms_enabled, logo_left, logo_right, logo_3, logo_4')
      .eq('event_id', eventId).single(),
    supabase.from('live_events')
      .select('theme, slug')
      .eq('id', eventId).single(),
  ])

  const dealerName = config?.dealer_name ?? 'Sims For Hire'
  const eventName = config?.event_name ?? 'Simulator Challenge'
  const themeColor = getThemeByKey(eventData?.theme || 'default').colors.primary
  const brandLogoUrl = config?.logo_left || ''
  const sponsorLogos = [config?.logo_right, config?.logo_3, config?.logo_4].filter(Boolean) as string[]
  const eventSlug = eventData?.slug || params.eventSlug!

  // Send SMS
  if (config?.sms_enabled) {
    const smsResult = await sendSMS(
      phone,
      `Hey ${name}! You're registered for the ${dealerName} ${eventName}. There are currently ${queuePos} people in the queue. Please stand in line and wait to be called. If your turn is missed you will have to get in the back of the line. Good luck!`,
    )
    await supabase
      .from('racers')
      .update({ sms_sent: smsResult.ok, sms_status: smsResult.ok ? 'sent' : 'failed' })
      .eq('id', data.id)
  }

  // Send email
  if (email) {
    const subject = `You're registered! ${queuePos} people in queue — ${dealerName} ${eventName}`
    const html = registrationEmail(name, queuePos, dealerName, eventName, { themeColor, brandLogoUrl, sponsorLogos, eventSlug })
    const text = registrationPlainText(name, queuePos, dealerName, eventName)
    const emailResult = await sendEmail(email, subject, html, text)

    if (!emailResult.ok) {
      console.error(`[Register] Email failed for ${name} (${email}):`, emailResult.error)
    }
  }

  return new Response(JSON.stringify({ racer: data }))
}
