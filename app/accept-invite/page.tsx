'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function AcceptInvitePage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  // parse the token from the URL manually
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token'));
  }, []);

  const [invite, setInvite] = useState<{
    inviteeEmail: string;
    inviterEmail: string;
    businessName: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // fetch invite metadata once we have the token
  useEffect(() => {
    if (!token) return;
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(body => {
        if (body.error) throw new Error(body.error);
        setInvite(body);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!invite || !token) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setSubmitting(true);

    const { error: signErr } = await supabase.auth.signUp({
      email: invite.inviteeEmail,
      password,
      options: { data: { invited: token } },
    });

    if (signErr) {
      setError(signErr.message);
      setSubmitting(false);
      return;
    }

    const res = await fetch(`/api/invite/${token}/accept`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || 'Failed to accept invitation.');
      setSubmitting(false);
      return;
    }

    router.replace('/dashboard');
  };

  if (loading) return <p className="p-8 text-center">Loading invite…</p>;
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;
  if (!invite) return null;

  return (
    <main className="max-w-md mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">You’ve Been Invited!</h1>
      <p>
        Invited by <strong>{invite.inviterEmail}</strong> to join{' '}
        <strong>{invite.businessName}</strong> as{' '}
        <strong>{invite.role}</strong>.
      </p>
      <form onSubmit={handleClaim} className="space-y-4">
        <label className="block">
          <span className="text-gray-700">Email</span>
          <input
            type="email"
            value={invite.inviteeEmail}
            readOnly
            className="w-full bg-gray-100 border rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-gray-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-gray-700">Confirm Password</span>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Account & Join'}
        </button>
      </form>
    </main>
  );
}
