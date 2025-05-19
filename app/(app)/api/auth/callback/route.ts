// app/api/auth/callback/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/app/(app)/lib/supabaseAdmin'  // adjust path as needed

export async function GET(req: NextRequest) {
  // 1. Let Supabase Auth Helpers parse the code & set auth cookies on `res`
  const res = NextResponse.next()
  const sb = createRouteHandlerClient({ req, res })

  const {
    data: { session },
    error: sessionErr,
  } = await sb.auth.getSession()

  if (sessionErr || !session) {
    console.error('Auth callback error:', sessionErr)
    // send them back to login with an error query
    const msg = encodeURIComponent(sessionErr?.message ?? 'OAuth failed')
    return NextResponse.redirect(new URL(`/?error=${msg}`, req.url))
  }

  // 2. (Optional) your existing de-dup & link logic:
  const { user } = session
  const email = user.email!
  const newId = user.id

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .neq('id', newId)
    .single()

  if (existing) {
    await supabaseAdmin.auth.admin.deleteUser(newId)
    await (supabaseAdmin.auth.admin as any).linkExternalAccount({
      userId: existing.id,
      provider: 'google',
      providerToken: session.provider_token,
      accessToken: session.access_token,
    })
  }

  // 3. **Redirect to /dashboard**, now that cookies are set
  return NextResponse.redirect(new URL('/dashboard', req.url), {
    // preserve the cookies that sb.auth.getSession() just set
    headers: res.headers,
  })
}
