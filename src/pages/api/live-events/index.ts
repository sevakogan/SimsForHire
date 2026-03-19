export const prerender = false
import type { APIRoute } from 'astro'
import { createServiceClient } from '../../../lib/supabase'
import { slugify } from '../../../lib/s4m/event-helpers'

/** GET /api/live-events — list all active events with racer counts */
export const GET: APIRoute = async () => {
  const supabase = createServiceClient()

  const { data: events, error } = await supabase
    .from('live_events')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const enriched = await Promise.all(
    (events ?? []).map(async (event) => {
      const { count } = await supabase
        .from('racers')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
      return { ...event, racer_count: count ?? 0 }
    }),
  )

  return new Response(JSON.stringify(enriched))
}

/** POST /api/live-events — create a new event + config */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json()
  const { name, theme, admin_pin, dealer_name, track_name, sms_enabled, event_date, event_time } = body as {
    name?: string
    theme?: string
    admin_pin?: string
    dealer_name?: string
    track_name?: string
    sms_enabled?: boolean
    event_date?: string
    event_time?: string
  }

  if (!name || !name.trim()) {
    return new Response(JSON.stringify({ error: 'Event name is required' }), { status: 400 })
  }

  if (!admin_pin || admin_pin.length < 4) {
    return new Response(JSON.stringify({ error: 'Admin PIN must be at least 4 digits' }), { status: 400 })
  }

  const baseSlug = slugify(name)
  if (!baseSlug) {
    return new Response(JSON.stringify({ error: 'Invalid event name' }), { status: 400 })
  }

  const supabase = createServiceClient()

  // Generate unique slug
  let slug = baseSlug
  let attempt = 0
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from('live_events')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  if (attempt >= 10) {
    return new Response(JSON.stringify({ error: 'Could not generate unique slug' }), { status: 409 })
  }

  const { data: event, error: eventErr } = await supabase
    .from('live_events')
    .insert({ slug, name: name.trim(), theme: theme || 'default' })
    .select()
    .single()

  if (eventErr) {
    return new Response(JSON.stringify({ error: eventErr.message }), { status: 500 })
  }

  const { error: configErr } = await supabase
    .from('event_config')
    .insert({
      event_id: event.id,
      dealer_name: dealer_name?.trim() || name.trim(),
      event_name: name.trim(),
      admin_pin,
      track_name: track_name?.trim() || 'Circuit',
      sms_enabled: sms_enabled ?? false,
      event_date: event_date?.trim() || '',
      event_time: event_time?.trim() || '',
    })

  if (configErr) {
    await supabase.from('live_events').delete().eq('id', event.id)
    return new Response(JSON.stringify({ error: configErr.message }), { status: 500 })
  }

  return new Response(JSON.stringify(event), { status: 201 })
}
