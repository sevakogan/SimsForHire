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

  if (!email?.trim() || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Valid email is required' }), { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.auth.admin.updateUserById(auth.userId, {
    email: email.trim(),
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, message: 'Email updated' }))
}
