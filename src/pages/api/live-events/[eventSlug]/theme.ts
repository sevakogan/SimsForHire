export const prerender = false
import type { APIRoute } from 'astro'
import { createServiceClient } from '../../../../lib/supabase'
import { resolveEventSlug } from '../../../../lib/s4m/event-helpers'
import { isCustomHex, THEME_PRESETS } from '../../../../lib/s4m/themes'

function isValidTheme(value: string): boolean {
  return isCustomHex(value) || THEME_PRESETS.some(t => t.key === value)
}

export const PATCH: APIRoute = async ({ params, request }) => {
  const eventId = await resolveEventSlug(params.eventSlug!)
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
  }

  try {
    const body = await request.json()
    const { theme } = body

    if (typeof theme !== 'string' || !isValidTheme(theme)) {
      return new Response(
        JSON.stringify({ error: 'Invalid theme value. Must be a preset key or hex color (#RRGGBB).' }),
        { status: 400 },
      )
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('live_events')
      .update({ theme, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ event: data }))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
