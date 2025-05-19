import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  const res = NextResponse.next()
  const supabase = createRouteHandlerClient({ req, res })
  const { email, role } = await req.json()

  // 1. Authorize: only Owners
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user!.id)
    .single()
  if (membership?.role !== 'owner')
    return NextResponse.json({ error: 'Only owners can invite' }, { status: 403 })

  // 2. Create invite record
  const token = crypto.randomUUID()
  await supabase.from('invites').insert({
    business_id: membership.business_id,
    email,
    role,
    token
  })

  // 3. Send email via Resend
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${token}`
  await resend.emails.send({
    from: 'noreply@companyflash.com',
    to: email,
    subject: `You’ve been invited to CompanyFlash`,
    html: `<p>You’ve been invited as <strong>${role}</strong>. <a href="${link}">Click here to join</a>.</p>`
  })

  return NextResponse.json({ success: true })
}
