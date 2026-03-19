export const prerender = false

import type { APIRoute } from 'astro'
import { clearAuthCookies } from '../../../lib/admin-auth'

export const POST: APIRoute = async () => {
  const cookies = clearAuthCookies()

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookies.join(', '),
    },
  })
}
