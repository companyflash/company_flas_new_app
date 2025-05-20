// lib/inviteService.js
import { supabase } from './supabaseClient';
import { sendInviteEmail } from './mailer';

/**
 * Ensures a single invite per user and per email.
 * @param {string} userId
 * @param {string} email
 * @returns {{id: string, sent_at: string}}
 */
export async function sendInvite(userId, email) {
  // 1) Check if this exact invite already exists
  const { data: existing, error: selErr } = await supabase
    .from('invites')
    .select('id, sent_at')
    .eq('user_id', userId)
    .eq('email', email)
    .single();

  if (selErr && selErr.code !== 'PGRST116') throw selErr;
  if (existing) {
    return existing;
  }

  // 2) Insert new invite and return id + sent_at
  const { data, error: insErr } = await supabase
    .from('invites')
    .insert([{ user_id: userId, email, sent_at: new Date().toISOString() }])
    .select('id, sent_at')
    .single();
  if (insErr) throw insErr;

  // 3) Send the email
  console.log('🛎  Sending invite to:', email);

  // build base URL from NEXTAUTH_URL or APP_URL
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (!baseUrl) {
    throw new Error('Missing NEXTAUTH_URL or APP_URL environment variable');
  }

  const inviteLink = `${baseUrl.replace(/\/$/, '')}/accept-invite?token=${data.id}`;

  await sendInviteEmail(
    email,
    inviteLink,
    { userId, inviteId: data.id }
  );

  return data;
}
