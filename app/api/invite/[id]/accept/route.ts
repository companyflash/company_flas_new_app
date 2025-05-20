// app/api/invite/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient }            from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing invite id' }, { status: 400 });

  // Authenticate via cookie
  const cookie = req.headers.get('cookie') || '';
  const authed = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { cookie } } }
  );
  const { data: { user }, error: authErr } = await authed.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Lookup invite
  const { data: inv, error: fetchErr } = await supabase
    .from('invites')
    .select('business_id, role')
    .eq('id', id)
    .single();
  if (fetchErr || !inv) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
  }

  // Add member with stored role
  await supabase.from('business_members').insert({
    business_id: inv.business_id,
    user_id:     user.id,
    role:        inv.role,
  });

  // Delete invite
  await supabase.from('invites').delete().eq('id', id);

  return NextResponse.json({ success: true });
}
