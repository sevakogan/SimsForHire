export const prerender = false
import type { APIRoute } from 'astro'
import { createServiceClient } from '../../../../lib/supabase'
import { resolveEventSlug } from '../../../../lib/s4m/event-helpers'
import { sendSMS } from '../../../../lib/s4m/twilio'
import { sendEmail } from '../../../../lib/s4m/email'
import { resultsEmail, resultsPlainText, getThemeByKey } from '../../../../lib/s4m/email-templates'
import { timeToMs } from '../../../../lib/s4m/utils'

export const POST: APIRoute = async ({ params, request }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  const body = await request.json()
  const { racerId, lapTime } = body as { racerId?: string; lapTime?: string }

  if (!racerId || !lapTime) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  const supabase = createServiceClient()
  const lapTimeMs = timeToMs(lapTime)

  const { data, error } = await supabase
    .from('racers')
    .update({
      lap_time: lapTime,
      lap_time_ms: lapTimeMs,
      completed_at: new Date().toISOString(),
    })
    .eq('id', racerId)
    .eq('event_id', eventId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Get leaderboard position
  const { count } = await supabase
    .from('racers')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('lap_time', 'is', null)
    .lte('lap_time_ms', lapTimeMs)

  const position = count ?? 1

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
  if (config?.sms_enabled && data.phone) {
    const podium = position <= 3 ? ' Podium position!' : ''
    await sendSMS(
      data.phone,
      `${data.name}, your ${dealerName} lap time is ${lapTime}! You're currently P${position} on the leaderboard.${podium} Check the screen to see where you rank!`,
    )
    await supabase
      .from('racers')
      .update({ sms_sent: true, sms_status: 'sent' })
      .eq('id', racerId)
  }

  // Send email
  if (data.email) {
    const subject = `Your lap time: ${lapTime} — P${position} on the leaderboard!`
    const html = resultsEmail(data.name, lapTime, position, dealerName, eventName, { themeColor, brandLogoUrl, sponsorLogos, eventSlug })
    const text = resultsPlainText(data.name, lapTime, position, dealerName, eventName, eventSlug)
    const emailResult = await sendEmail(data.email, subject, html, text)

    if (!emailResult.ok) {
      console.error(`[Time] Email failed for ${data.name} (${data.email}):`, emailResult.error)
    }
  }

  return new Response(JSON.stringify({ racer: data, position }))
}
