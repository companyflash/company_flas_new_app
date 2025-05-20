// app/api/onboarding/company/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1) Extract Bearer token
  const authHeader = request.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const token = match[1];

  // 2) Init Supabase client with that token
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  // 3) Get user
  const {
    data: { user },
    error: authErr
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 4) Parse + validate JSON body
  let payload: { name: string; industry: string; size: string };
  try {
    payload = await request.json();
    if (!payload.name || !payload.industry || !payload.size) {
      throw new Error('Missing fields');
    }
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // 5) Insert into the **businesses** table (not companies!)
  const { data: business, error: businessErr } = await supabase
    .from('businesses')
    .insert({
      name:     payload.name,
      industry: payload.industry,
      size:     payload.size,
    })
    .select('id')
    .single();

  if (businessErr || !business) {
    console.error('Business creation error:', businessErr);
    return NextResponse.json({ error: 'Could not create business' }, { status: 500 });
  }

  // 6) Link the user as owner
  const { error: memberErr } = await supabase
    .from('business_members')
    .insert({
      business_id: business.id,
      user_id:     user.id,
      role:        'owner',
    });

  if (memberErr) {
    console.error('Membership creation error:', memberErr);
    return NextResponse.json({ error: 'Could not assign owner role' }, { status: 500 });
  }

  return NextResponse.json({ business_id: business.id }, { status: 200 });
}
