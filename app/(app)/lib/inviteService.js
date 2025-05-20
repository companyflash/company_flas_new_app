// app/lib/inviteService.js
import { supabase } from './supabaseClient';
import { sendInviteEmail } from './mailer';

export async function sendInvite(userId, email, role = 'member') {
  // 1) Avoid duplicate
  const { data: existing, error: selErr } = await supabase
    .from('invites')
    .select('id, sent_at')
    .eq('user_id', userId)
    .eq('email', email)
    .single();
  if (selErr && selErr.code !== 'PGRST116') throw selErr;
  if (existing) return existing;

  // 2) Find inviter's business_id
  const { data: bmData, error: bmErr, status: bmStatus } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', userId)
    .single();
  if (bmErr && bmStatus === 406) {
    throw new Error('You must belong to a business before sending invites.');
  } else if (bmErr) {
    throw bmErr;
  }
  const business_id = bmData.business_id;

  // 3) Insert invite with role
  const { data, error: insErr } = await supabase
    .from('invites')
    .insert([{
      user_id,
      email,
      sent_at:     new Date().toISOString(),
      business_id,
      role,               // ← store the chosen role
    }])
    .select('id, sent_at')
    .single();
  if (insErr) throw insErr;

  // 4) Send email
  const baseUrl = (process.env.NEXTAUTH_URL || process.env.APP_URL).replace(/\/$/, '');
  const inviteLink = `${baseUrl}/accept-invite?token=${data.id}`;
  console.log('🛎  Sending invite to:', email, inviteLink);
  await sendInviteEmail(email, inviteLink, { userId, inviteId: data.id });

  return data;
}
