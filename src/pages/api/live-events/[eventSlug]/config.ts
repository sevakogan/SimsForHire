export const prerender = false
import type { APIRoute } from 'astro'
import { createServiceClient } from '../../../../lib/supabase'
import { resolveEventSlug } from '../../../../lib/s4m/event-helpers'

const ALLOWED_FIELDS = new Set([
  'dealer_name', 'event_name', 'track_name', 'admin_pin',
  'sms_enabled', 'logo_left', 'logo_right', 'logo_3', 'logo_4',
  'waiver_text', 'event_date', 'event_time', 'employee_pin',
])

export const GET: APIRoute = async ({ params }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('event_config')
    .select('*')
    .eq('event_id', eventId)
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ config: data }), {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

export const PUT: APIRoute = async ({ params, request }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    for (const key of Object.keys(body)) {
      if (ALLOWED_FIELDS.has(key)) {
        updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('event_config')
      .update(updates)
      .eq('event_id', eventId)
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ config: data }))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
