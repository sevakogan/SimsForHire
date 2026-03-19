export const prerender = false
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../lib/admin-auth'
import { createServiceClient } from '../../../lib/supabase'

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json()
  const { email } = body

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.auth.admin.inviteUserByEmail(email)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }))
}
