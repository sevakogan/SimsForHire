export const prerender = false
import type { APIRoute } from 'astro'
import { requireAuth, getAuthToken } from '../../../lib/admin-auth'
import { createServiceClient } from '../../../lib/supabase'
import { createClient } from '@supabase/supabase-js'

/** GET /api/admin/profile — get current user profile */
export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createServiceClient()

  // Get auth user email
  const token = getAuthToken(request)!
  const anonClient = createClient(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
  const { data: userData } = await anonClient.auth.getUser(token)
  const email = userData.user?.email ?? ''

  // Get profile from admin_profiles table
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('user_id', auth.userId)
    .single()

  return new Response(JSON.stringify({
    user_id: auth.userId,
    email,
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    avatar_url: profile?.avatar_url ?? '',
  }))
}

/** PUT /api/admin/profile — update profile (name, phone) */
export const PUT: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json()
  const { name, phone } = body

  const supabase = createServiceClient()

  // Upsert profile
  const { error } = await supabase
    .from('admin_profiles')
    .upsert({
      user_id: auth.userId,
      name: name?.trim() || '',
      phone: phone?.trim() || '',
    }, { onConflict: 'user_id' })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }))
}
