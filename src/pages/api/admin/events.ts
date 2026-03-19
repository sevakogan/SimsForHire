export const prerender = false
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../lib/admin-auth'
import { createServiceClient } from '../../../lib/supabase'
import { slugify } from '../../../lib/s4m/event-helpers'

/** GET /api/admin/events — list all events (active first, then archived) */
export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createServiceClient()
  const { data: events, error } = await supabase
    .from('live_events')
    .select('*, event_config(*)')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Enrich with racer counts
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

/** POST /api/admin/events — create a new event */
export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json()
  const { name, theme, admin_pin, dealer_name, track_name, sms_enabled, event_date, event_time, employee_pin, logo_left, logo_right } = body

  if (!name?.trim()) {
    return new Response(JSON.stringify({ error: 'Event name is required' }), { status: 400 })
  }
  if (!admin_pin || admin_pin.length < 4) {
    return new Response(JSON.stringify({ error: 'Admin PIN must be at least 4 digits' }), { status: 400 })
  }

  const baseSlug = slugify(name)
  const supabase = createServiceClient()

  let slug = baseSlug
  let attempt = 0
  while (attempt < 10) {
    const { data: existing } = await supabase.from('live_events').select('id').eq('slug', slug).maybeSingle()
    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
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
      sms_enabled: sms_enabled ?? false,
      event_date: event_date?.trim() || '',
      event_time: event_time?.trim() || '',
      employee_pin: employee_pin?.trim() || '',
      track_name: track_name?.trim() || 'Circuit',
      logo_left: logo_left?.trim() || '',
      logo_right: logo_right?.trim() || '',
    })

  if (configErr) {
    await supabase.from('live_events').delete().eq('id', event.id)
    return new Response(JSON.stringify({ error: configErr.message }), { status: 500 })
  }

  return new Response(JSON.stringify(event), { status: 201 })
}
