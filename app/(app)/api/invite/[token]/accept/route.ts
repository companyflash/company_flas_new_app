import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request, { params }) {
  const { token } = params
  const supabase = createRouteHandlerClient({ req, res: NextResponse.next() })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  // lookup invite
  const { data: inv, error: fetchErr } = await supabase
    .from('invites')
    .select('business_id, role')
    .eq('token', token)
    .single()
  if (fetchErr || !inv) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })

  // add to business_members
  await supabase.from('business_members').insert({
    business_id: inv.business_id,
    user_id: user.id,
    role: inv.role
  })

  // delete invite
  await supabase.from('invites').delete().eq('token', token)

  return NextResponse.json({ success: true })
}
