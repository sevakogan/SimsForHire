/**
 * Browser-side Supabase client for real-time subscriptions.
 * Uses the anon key (public) — safe to expose in client bundles.
 * Server-side code should use createServiceClient() from ../supabase.ts instead.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (client) return client

  const url = import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for browser client')
  }

  client = createClient(url, key, {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  })

  return client
}
