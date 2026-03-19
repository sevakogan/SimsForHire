import { createServiceClient } from '../supabase'

/**
 * Convert an event name to a URL-safe slug.
 * e.g. "Porsche Miami 2026" → "porsche-miami-2026"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Look up a live event's UUID by its slug.
 * Returns null if not found or archived.
 */
export async function resolveEventSlug(slug: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('live_events')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  return data?.id ?? null
}

/**
 * Build the page URL prefix for an event.
 * e.g. eventBasePath("porsche") → "/live/porsche"
 */
export function eventBasePath(slug: string): string {
  return `/live/${slug}`
}

/**
 * Build the API URL prefix for an event.
 * e.g. eventApiPath("porsche") → "/api/live-events/porsche"
 */
export function eventApiPath(slug: string): string {
  return `/api/live-events/${slug}`
}
