// app/api/invite/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing invite id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('invites')
    .select('email, role')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
  }

  return NextResponse.json(data);
}
