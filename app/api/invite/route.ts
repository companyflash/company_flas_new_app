// app/(app)/api/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendInvite } from '@/app/(app)/lib/inviteService';

// API route: POST /api/invite
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Use async cookies API
  const cookieStore = await cookies();
  // Initialize Supabase client with Next.js cookies
  const supabase = createRouteHandlerClient({ cookies });

  // Authenticate user via Supabase cookie
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Parse and validate JSON body
  let email: string;
  try {
    const body = await request.json();
    if (!body || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid email' }, { status: 400 });
    }
    email = body.email;
  } catch (parseError: unknown) {
    console.error('Invalid JSON in request body:', parseError);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Execute invite logic
  try {
    const invite = await sendInvite(user.id, email);
    return NextResponse.json({ sent_at: invite.sent_at }, { status: 200 });
  } catch (inviteError: unknown) {
    const message = inviteError instanceof Error ? inviteError.message : String(inviteError);
    console.error('Invite API error:', inviteError);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
