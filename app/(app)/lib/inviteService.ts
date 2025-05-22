// app/(app)/lib/inviteService.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendInviteEmail } from './mailer';

export interface Invite {
  id: string;
  sent_at: string;
  business_name: string;
}

export async function sendInvite(
  sb: SupabaseClient,
  inviterId: string,
  inviterEmail: string,
  inviteeEmail: string,
  role: 'admin' | 'member' = 'member'
): Promise<Invite> {
  // 1) Dedupe
  const { data: dup, error: dupErr } = await sb
    .from('invites')
    .select('id, sent_at, business_name')
    .eq('user_id', inviterId)
    .eq('email', inviteeEmail)
    .limit(1)
    .single();
  // ignore “no rows” error
  if (dupErr && (dupErr as any).code !== 'PGRST116') throw dupErr;
  if (dup) return dup;

  // 2) Find inviter's business
  const { data: bm, error: bmErr } = await sb
    .from('business_members')
    .select('business_id')
    .eq('user_id', inviterId)
    .limit(1)
    .single();
  if (bmErr || !bm) {
    throw new Error('You must belong to a business before sending invites.');
  }

  // 3) Fetch business name
  const { data: biz, error: bizErr } = await sb
    .from('businesses')
    .select('name')
    .eq('id', bm.business_id)
    .limit(1)
    .single();
  if (bizErr || !biz) {
    throw new Error('Could not fetch business name');
  }

  // 4) Insert the invite
  const now = new Date().toISOString();
  const { data, error: insErr } = await sb
    .from('invites')
    .insert({
      user_id: inviterId,
      inviter_email: inviterEmail,
      business_id: bm.business_id,
      business_name: biz.name,
      email: inviteeEmail,
      role,
      sent_at: now,
    })
    .select('id, sent_at, business_name')
    .limit(1)
    .single();
  if (insErr || !data) {
    throw insErr ?? new Error('Failed to create invite');
  }

  // 5) Send the email
  const base =
    (process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? '').replace(/\/$/, '');
  const link = `${base}/accept-invite?token=${data.id}`;
  await sendInviteEmail(inviteeEmail, link, {
    inviterEmail,
    inviteId: data.id,
    businessName: biz.name,
  });

  return { id: data.id, sent_at: data.sent_at, business_name: biz.name };
}
