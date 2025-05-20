// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Supabase’s cookie name is "sb-<your-project-ref>-auth-token"
const AUTH_COOKIE = 'sb-tmtkummwvvuqymcheamp-auth-token'

export function middleware(req: NextRequest) {
  const { cookies, nextUrl } = req
  const url = nextUrl.clone()
  const token = cookies.get(AUTH_COOKIE)

  // 1) Never interfere with any /settings routes
  if (url.pathname.startsWith('/settings')) {
    return NextResponse.next()
  }

  // 2) If landing on "/", skip the redirect if this looks like an OAuth callback or invite flow
  if (url.pathname === '/' && token) {
    // If there’s a `code` (OAuth), or `tab` (invite flow), let it through
    const qp = url.searchParams
    if (qp.has('code') || qp.has('tab') || qp.has('token')) {
      return NextResponse.next()
    }
    // Otherwise, safe to send dashboard
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 3) Protect /dashboard
  if (url.pathname.startsWith('/dashboard') && !token) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
