import { InviteButton } from './InviteButton';
import { supabase } from '@/app/(app)/lib/supabaseClient';

export default async function InvitePage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p>Please sign in to send invites.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Send an Invite</h1>
      <InviteButton userId={user.id} email={user.email} />
    </div>
  );
}
