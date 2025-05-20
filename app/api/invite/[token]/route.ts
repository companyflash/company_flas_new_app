import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(req: Request, { params }) {
  const { token } = params
  const supabase = createRouteHandlerClient({ req, res: NextResponse.next() })
  const { data, error } = await supabase
    .from('invites')
    .select('email, role')
    .eq('token', token)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  return NextResponse.json(data)
}
