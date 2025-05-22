// app/api/invite/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // 1) Extract & validate the token
  const { id } = await ctx.params;
  console.log('📥 [invite/accept] token:', id);
  if (!id) {
    console.error('❌ Missing invite id');
    return NextResponse.json({ error: 'Missing invite id' }, { status: 400 });
  }

  // 2) Create the Supabase client using Next.js cookies
  const supabase = createRouteHandlerClient({ cookies });

  // 3) Verify invitee is signed in
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  console.log('👤 getUser →', { user, authErr });
  if (authErr || !user) {
    console.error('❌ Not authenticated');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 4) Look up invite record, ensure not already accepted
  const { data: inv, error: fetchErr } = await supabase
    .from('invites')
    .select('business_id, role, accepted_at')
    .eq('id', id)
    .single();
  console.log('🔍 invite record →', { inv, fetchErr });
  if (fetchErr || !inv) {
    console.error('❌ Invalid invite');
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
  }
  if (inv.accepted_at) {
    console.warn('⚠️ Invite already accepted at', inv.accepted_at);
    return NextResponse.json({ error: 'Invite already accepted' }, { status: 409 });
  }

  // 5) Insert into business_members
  const { error: insertErr } = await supabase
    .from('business_members')
    .insert({
      business_id: inv.business_id,
      user_id: user.id,
      role: inv.role,
    });
  console.log('➕ insert business_members →', { insertErr });
  if (insertErr) {
    console.error('❌ business_members insert failure', insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // 6) Soft-delete the invite: mark accepted_at & accepted_by
  const { error: updateErr } = await supabase
    .from('invites')
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq('id', id);
  console.log('🗂 mark invite accepted →', { updateErr });
  if (updateErr) {
    console.warn('⚠️ failed to mark invite accepted (non-fatal)', updateErr);
  }

  console.log('✅ invite accepted successfully');
  return NextResponse.json({ success: true }, { status: 200 });
}
