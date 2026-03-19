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
  const { userId } = body

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 })
  }

  // Prevent self-deletion
  if (userId === auth.userId) {
    return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), { status: 400 })
  }

  const supabase = createServiceClient()

  // Delete profile first, then auth user
  await supabase.from('admin_profiles').delete().eq('user_id', userId)
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }))
}
