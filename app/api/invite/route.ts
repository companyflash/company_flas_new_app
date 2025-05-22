// app/api/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendInvite } from '@/app/(app)/lib/inviteService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // bind client
  const supabase = createRouteHandlerClient({ cookies });

  // auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user?.id || !user.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // parse body
  let inviteeEmail: string, role: string;
  try {
    const body = await req.json();
    if (typeof body.email !== 'string' || typeof body.role !== 'string') {
      throw new Error();
    }
    inviteeEmail = body.email;
    role = body.role;
  } catch {
    return NextResponse.json(
      { error: 'Missing or invalid email/role' },
      { status: 400 }
    );
  }

  // delegate
  try {
    const inv = await sendInvite(
      supabase,
      user.id,         // inviterId
      user.email,      // inviterEmail
      inviteeEmail,    // inviteeEmail
      role as 'admin' | 'member'
    );
    return NextResponse.json({ sent_at: inv.sent_at }, { status: 200 });
  } catch (err: any) {
    console.error('Invite API error:', err.message);
    const msg = err.message || 'Invite failed';
    const status = msg.includes('must belong') ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
