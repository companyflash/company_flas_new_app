// app/api/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies }                from 'next/headers';
import { sendInvite }             from '@/app/(app)/lib/inviteService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let email: string, role: string;
  try {
    const body = await req.json();
    if (typeof body.email !== 'string' || typeof body.role !== 'string') {
      throw new Error();
    }
    email = body.email;
    role  = body.role;
  } catch {
    return NextResponse.json({ error: 'Missing or invalid email/role' }, { status: 400 });
  }

  try {
    const invite = await sendInvite(user.id, email, role as 'admin'|'member');
    return NextResponse.json({ sent_at: invite.sent_at });
  } catch (e: any) {
    console.error('Invite API error:', e);
    const msg = e.message || 'Invite failed';
    const status = msg.includes('must belong to a business') ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
