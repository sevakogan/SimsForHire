import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createAnonClient(): SupabaseClient {
  return createClient(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export function createServiceClient(): SupabaseClient {
  return createClient(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}
