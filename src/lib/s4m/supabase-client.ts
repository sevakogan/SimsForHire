/**
 * Browser-side Supabase client for real-time subscriptions.
 * Uses the anon key (public) — safe to expose in client bundles.
 *
 * IMPORTANT: Astro only exposes PUBLIC_ prefixed env vars to the browser.
 * Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in your env.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (client) return client

  // In Astro, only PUBLIC_ prefixed vars are available in browser bundles.
  // NEXT_PUBLIC_ vars only work server-side via import.meta.env.
  const url = (import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined
  const key = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined

  if (!url || !key) {
    console.error('[Supabase Browser] Missing env vars. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.')
    // Return a dummy client that won't crash — real-time just won't work
    return createClient('https://placeholder.supabase.co', 'placeholder')
  }

  client = createClient(url, key, {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  })

  return client
}
