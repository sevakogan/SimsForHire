export const prerender = false
import type { APIRoute } from 'astro'
import { requireAuth, getAuthToken } from '../../../lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json()
  const { email } = body

  if (!email?.trim() || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Valid email is required' }), { status: 400 })
  }

  const token = getAuthToken(request)!
  const supabase = createClient(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  await supabase.auth.setSession({ access_token: token, refresh_token: '' })
  const { error } = await supabase.auth.updateUser({ email: email.trim() })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, message: 'Confirmation email sent to new address' }))
}
