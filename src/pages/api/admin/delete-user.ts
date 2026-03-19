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

  if (userId === auth.userId) {
    return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), { status: 400 })
  }

  const supabase = createServiceClient()

  // Delete profile first (in case cascade isn't set up)
  const { error: profileErr } = await supabase
    .from('admin_profiles')
    .delete()
    .eq('user_id', userId)

  if (profileErr) {
    console.error('[Delete User] Profile delete error:', profileErr.message)
  }

  // Delete auth user
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    console.error('[Delete User] Auth delete error:', error.message)
    return new Response(JSON.stringify({ error: `Failed to delete user: ${error.message}` }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }))
}
