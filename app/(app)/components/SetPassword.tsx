'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';

interface Identity { provider: string }

export default function SetPassword() {
  const supabase = useSupabaseClient();
  const session = useSession();

  const [newPw, setNewPw]             = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        const metadata = data.user.user_metadata as { identities?: Identity[] };
        const identities = metadata.identities ?? [];
        setHasPassword(identities.some(i => i.provider === 'email'));
      } else {
        setHasPassword(false);
      }
    })();
  }, [session, supabase]);

  if (hasPassword === null || hasPassword) return null;

  const handleSet = async () => {
    setError(null);
    setSuccess(null);
    if (newPw.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password set! You can now log in with email + password.');
      setNewPw('');
      setConfirmPw('');
      setHasPassword(true);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-sm mx-auto space-y-4">
      <h3 className="text-lg font-semibold">Set a Password</h3>
      <input
        type="password"
        placeholder="New password"
        value={newPw}
        onChange={e => setNewPw(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPw}
        onChange={e => setConfirmPw(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />
      <button
        onClick={handleSet}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Set Password'}
      </button>
      {error   && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}
    </div>
  );
}
