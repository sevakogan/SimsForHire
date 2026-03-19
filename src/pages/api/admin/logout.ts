export const prerender = false

import type { APIRoute } from 'astro'
import { clearAuthCookies } from '../../../lib/admin-auth'

export const POST: APIRoute = async () => {
  const cookies = clearAuthCookies()

  const headers = new Headers({ 'Content-Type': 'application/json' })
  for (const cookie of cookies) {
    headers.append('Set-Cookie', cookie)
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers })
}
