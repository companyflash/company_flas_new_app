// app/accept-invite/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type InviteData = {
  email: string;
  role:  string;
};

export default function AcceptInvitePage() {
  const params      = useSearchParams();
  const router      = useRouter();
  const token       = params.get('token'); // this is your invite.id

  const [invite, setInvite]   = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Fetch invite metadata
  useEffect(() => {
    if (!token) {
      setError('No invite token provided.');
      setLoading(false);
      return;
    }
    fetch(`/api/invite/${token}`)
      .then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || res.statusText);
        return body as InviteData;
      })
      .then(data => {
        setInvite(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/invite/${token}/accept`, { method: 'POST' })
      .then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || res.statusText);
        // success → let them set password
        router.replace('/settings?tab=account');
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  if (loading) return <p className="p-8 text-center">Loading invite…</p>;
  if (error)   return <p className="p-8 text-center text-red-500">Error: {error}</p>;

  return (
    <main className="max-w-md mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Accept Invitation</h1>
      <p>
        You’ve been invited as <strong>{invite!.role}</strong> for{' '}
        <strong>{invite!.email}</strong>.
      </p>
      <button
        onClick={handleAccept}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Accept Invite
      </button>
    </main>
  );
}
