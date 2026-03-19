export const prerender = false
import type { APIRoute } from 'astro'
import { createServiceClient } from '../../../../lib/supabase'
import { resolveEventSlug } from '../../../../lib/s4m/event-helpers'

export const GET: APIRoute = async ({ params }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('racers')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ racers: data }))
}
