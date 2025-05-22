// app/accept-invite/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams }     from 'next/navigation';
import { useSupabaseClient }              from '@supabase/auth-helpers-react';

export default function AcceptInvitePage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const supabase = useSupabaseClient();
  const token    = params.get('token')!;

  const [invite, setInvite]   = useState<{
    inviteeEmail: string;
    inviterEmail: string;
    businessName: string;
    role:          string;
  } | null>(null);

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [sending, setSending]     = useState(false);
  const [email, setEmail]         = useState('');

  // load invite metadata
  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(body => {
        if (body.error) throw new Error(body.error);
        setInvite(body);
        setEmail((body as any).inviteeEmail);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSendLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setError(null);
    setSending(true);

    const { error: supErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // after they click the magic link, redirect them into your verify-email step
        emailRedirectTo: `${window.location.origin}/settings?tab=account&inviteToken=${encodeURIComponent(token)}`,
      },
    });

    setSending(false);
    if (supErr) setError(supErr.message);
    else {
      // show a simple "check your inbox" confirmation
      router.replace('/accept-invite?token=' + token + '&sent=1');
    }
  };

  if (loading) return <p className="p-8 text-center">Loading invite…</p>;
  if (error)   return <p className="p-8 text-center text-red-500">{error}</p>;
  if (!invite) return null;

  return (
    <main className="max-w-md mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">You’ve Been Invited!</h1>

      <p>
        You’ve been invited by{' '}
        <strong>{invite.inviterEmail}</strong> to join{' '}
        <strong>{invite.businessName}</strong> as a{' '}
        <strong>{invite.role}</strong>.
      </p>

      <p className="text-gray-600">
        We’ll send a one-time login link to{' '}
        <strong>{invite.inviteeEmail}</strong>.
      </p>

      <form onSubmit={handleSendLink} className="space-y-4">
        {error && <p className="text-red-500">{error}</p>}

        <label className="block">
          <span className="text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full bg-gray-100 border rounded px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send Sign-Up Link'}
        </button>
      </form>

      <p className="text-sm text-gray-500">
        Didn’t receive it? Check your spam folder or ask your colleague to resend.
      </p>
    </main>
  );
}
