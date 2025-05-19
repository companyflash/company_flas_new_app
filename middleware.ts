// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Supabase’s cookie name is "sb-<your-project-ref>-auth-token"
const AUTH_COOKIE = 'sb-tmtkummwvvuqymcheamp-auth-token'

export function middleware(req: NextRequest) {
  const { cookies, nextUrl } = req
  const url = nextUrl.clone()

  const token = cookies.get(AUTH_COOKIE)

  // If you hit "/" while logged in, send to /dashboard
  if (url.pathname === '/' && token) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Protect /dashboard (and all its sub-paths)
  if (url.pathname.startsWith('/dashboard') && !token) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
