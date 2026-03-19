export const prerender = false
import type { APIRoute } from 'astro'
import { createServiceClient } from '../../../../lib/supabase'
import { resolveEventSlug } from '../../../../lib/s4m/event-helpers'

export const POST: APIRoute = async ({ params, request }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const { pin } = body as { pin?: string }

  const supabase = createServiceClient()
  const { data: config } = await supabase
    .from('event_config')
    .select('admin_pin')
    .eq('event_id', eventId)
    .single()

  if (!pin || pin !== config?.admin_pin) {
    return new Response(JSON.stringify({ error: 'Invalid PIN' }), { status: 403 })
  }

  const { error } = await supabase
    .from('racers')
    .delete()
    .eq('event_id', eventId)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }))
}
