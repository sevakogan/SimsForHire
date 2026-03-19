export const prerender = false
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../../lib/admin-auth'
import { createServiceClient } from '../../../../lib/supabase'

/** PATCH /api/admin/events/[id] — archive or update event */
export const PATCH: APIRoute = async ({ params, request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json()
  const supabase = createServiceClient()

  // Only allow status updates (archive/activate)
  const updates: Record<string, unknown> = {}
  if (body.status && ['active', 'archived'].includes(body.status)) {
    updates.status = body.status
  }
  if (body.name) updates.name = body.name
  if (body.theme) updates.theme = body.theme

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ error: 'No valid fields' }), { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('live_events')
    .update(updates)
    .eq('id', params.id!)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify(data))
}

/** DELETE /api/admin/events/[id] — permanently delete event and all data */
export const DELETE: APIRoute = async ({ params, request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createServiceClient()

  // Delete racers, config, then event
  await supabase.from('racers').delete().eq('event_id', params.id!)
  await supabase.from('event_config').delete().eq('event_id', params.id!)
  const { error } = await supabase.from('live_events').delete().eq('id', params.id!)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }))
}
