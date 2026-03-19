import { createClient } from '@supabase/supabase-js'

const COOKIE_NAME = 's4h_admin_token'
const REFRESH_COOKIE = 's4h_admin_refresh'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function getAuthToken(request: Request): string | null {
  const cookies = request.headers.get('cookie') ?? ''
  const match = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  return match ? match[1] : null
}

function getRefreshToken(request: Request): string | null {
  const cookies = request.headers.get('cookie') ?? ''
  const match = cookies.match(new RegExp(`${REFRESH_COOKIE}=([^;]+)`))
  return match ? match[1] : null
}

export async function requireAuth(
  request: Request,
): Promise<{ authorized: true; userId: string } | { authorized: false }> {
  const token = getAuthToken(request)
  if (!token) return { authorized: false }

  const supabase = createClient(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    // Try refresh
    const refreshToken = getRefreshToken(request)
    if (!refreshToken) return { authorized: false }

    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })
    if (refreshError || !refreshData.user) return { authorized: false }

    return { authorized: true, userId: refreshData.user.id }
  }

  return { authorized: true, userId: data.user.id }
}

export function setAuthCookies(accessToken: string, refreshToken: string): string[] {
  const secure = 'HttpOnly; SameSite=Lax; Path=/'
  return [
    `${COOKIE_NAME}=${accessToken}; ${secure}; Max-Age=${MAX_AGE}`,
    `${REFRESH_COOKIE}=${refreshToken}; ${secure}; Max-Age=${MAX_AGE}`,
  ]
}

export function clearAuthCookies(): string[] {
  return [
    `${COOKIE_NAME}=; Path=/; Max-Age=0`,
    `${REFRESH_COOKIE}=; Path=/; Max-Age=0`,
  ]
}
