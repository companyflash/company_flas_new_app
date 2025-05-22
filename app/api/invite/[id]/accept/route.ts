// app/api/invite/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies }                 from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // 1) Extract & validate the token
  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ error: 'Missing invite id' }, { status: 400 })
  }

  // 2) Initialize Supabase with cookie support
  const supabase = createRouteHandlerClient({
    // NextAuth v14+ expects cookies as an async function
    cookies: () => Promise.resolve(cookies())
  })

  // 3) Ensure the user is authenticated
  const {
    data: { user },
    error: authErr
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 4) Load the invite record
  const { data: inv, error: fetchErr } = await supabase
    .from('invites')
    .select('business_id, role')
    .eq('id', id)
    .single()

  if (fetchErr || !inv) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  }

  // 5) Add the user to business_members
  const { error: insertErr } = await supabase
    .from('business_members')
    .insert({
      business_id: inv.business_id,
      user_id:     user.id,
      role:        inv.role,
    })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // 6) Delete the invite so it can’t be reused
  await supabase
    .from('invites')
    .delete()
    .eq('id', id)

  // 7) Redirect into our “check your inbox” UX
  const redirectUrl = new URL('/verify-email', req.url)
  return NextResponse.redirect(redirectUrl, 303)
}
