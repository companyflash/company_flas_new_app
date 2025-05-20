// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const url        = new URL(req.url);
  const code       = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirectTo') || '/';

  // Helper to build absolute URLs based on the incoming request
  const makeUrl = (path: string) => new URL(path, url.origin);

  if (!code) {
    // no code → send home
    return NextResponse.redirect(makeUrl('/'));
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, detectSessionInUrl: false }
  });
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error('OAuth exchange failed:', error);
    return NextResponse.redirect(makeUrl('/'));
  }

  // 2) Build a response that sets the Supabase cookies, then redirects
  const res = NextResponse.redirect(makeUrl(redirectTo));

  res.cookies.set('sb-access-token',  data.session.access_token,  {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: data.session.expires_in,
  });
  res.cookies.set('sb-refresh-token', data.session.refresh_token, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}
