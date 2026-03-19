export const prerender = false
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../lib/admin-auth'
import { createServiceClient } from '../../../lib/supabase'

const VALID_ROLES = ['admin', 'marketing', 'customer']

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json()
  const { email, role } = body

  if (!email?.trim()) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 })
  }

  const assignRole = VALID_ROLES.includes(role) ? role : 'admin'

  const supabase = createServiceClient()

  // Invite user via Supabase Auth (sends magic link email)
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email.trim())

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Create profile with role for the invited user
  if (data.user) {
    await supabase.from('admin_profiles').upsert({
      user_id: data.user.id,
      name: '',
      role: assignRole,
    }, { onConflict: 'user_id' })
  }

  return new Response(JSON.stringify({ ok: true }))
}
