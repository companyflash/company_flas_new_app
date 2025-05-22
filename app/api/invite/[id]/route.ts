import { NextRequest, NextResponse }           from 'next/server'
import { createRouteHandlerClient }            from '@supabase/auth-helpers-nextjs'
import { cookies }                             from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // 1) Grab & validate the token param
  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ error: 'Missing invite id' }, { status: 400 })
  }

  // 2) Initialize Supabase, giving it a function that returns the Next cookies
  const supabase = createRouteHandlerClient({
    // at runtime Next will call this and get a ReadonlyRequestCookies
    cookies: () => Promise.resolve(cookies())
  })

  // 3) Fetch the invite row
  const { data: invite, error: invErr } = await supabase
    .from('invites')
    .select('email, role, inviter_email, business_name')
    .eq('id', id)
    .single()

  if (invErr || !invite) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  }

  // 4) Return exactly what your client expects
  return NextResponse.json({
    inviteeEmail: invite.email,
    role:         invite.role,
    inviterEmail: invite.inviter_email,
    businessName: invite.business_name,
  })
}
