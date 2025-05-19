import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const res = NextResponse.next()
  const supabase = createRouteHandlerClient({ req, res })

  // 1. Get current user
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: 'No user' }, { status: 401 })

  // 2. Create a new business
  const biz = await supabase
    .from('businesses')
    .insert({ name: `${user.email}'s Company` })
    .select('id')
    .single()
  if (biz.error) return NextResponse.json({ error: biz.error.message }, { status: 500 })

  // 3. Add them as Owner
  const mem = await supabase.from('business_members').insert({
    business_id: biz.data.id,
    user_id: user.id,
    role: 'owner'
  })
  if (mem.error) return NextResponse.json({ error: mem.error.message }, { status: 500 })

  return NextResponse.json({ business_id: biz.data.id })
}
