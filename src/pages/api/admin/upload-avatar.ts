export const prerender = false
import type { APIRoute } from 'astro'
import { requireAuth } from '../../../lib/admin-auth'
import { createServiceClient } from '../../../lib/supabase'

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('avatar') as File | null

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })
  }

  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return new Response(JSON.stringify({ error: 'Only JPEG, PNG, and WebP images are allowed' }), { status: 400 })
  }

  // Max 2MB
  if (file.size > 2 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'File must be under 2MB' }), { status: 400 })
  }

  const supabase = createServiceClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `avatars/${auth.userId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('admin')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('admin').getPublicUrl(path)
  const avatar_url = urlData.publicUrl + `?t=${Date.now()}`

  // Update profile with avatar URL
  await supabase
    .from('admin_profiles')
    .upsert({ user_id: auth.userId, avatar_url }, { onConflict: 'user_id' })

  return new Response(JSON.stringify({ avatar_url }))
}
