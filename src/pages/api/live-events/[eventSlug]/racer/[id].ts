export const prerender = false
import type { APIRoute } from 'astro'
import { createServiceClient } from '../../../../../lib/supabase'
import { resolveEventSlug } from '../../../../../lib/s4m/event-helpers'

export const DELETE: APIRoute = async ({ params }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('racers')
    .delete()
    .eq('id', params.id!)
    .eq('event_id', eventId)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }))
}

export const PATCH: APIRoute = async ({ params, request }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('racers')
    .update(body)
    .eq('id', params.id!)
    .eq('event_id', eventId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ racer: data }))
}
