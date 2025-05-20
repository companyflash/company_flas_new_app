// app/(app)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  useSession,
  useSupabaseClient,
} from '@supabase/auth-helpers-react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { InviteUsers } from '../components/InviteUsers';

export default function SettingsPage() {
  const sessionObj   = useSession();
  const supabase     = useSupabaseClient();
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Which tab is active
  const [tab, setTab] = useState<'invitations' | 'account'>(
    searchParams.get('tab') === 'account' ? 'account' : 'invitations'
  );

  // undefined until we inspect the session identities & metadata
  const [needsPasswordSetup, setNeedsPasswordSetup] =
    useState<boolean | undefined>(undefined);

  // Password form state
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  // Team invites list
  const [team, setTeam] = useState<{ email: string; sent_at: string }[]>([]);

  // 1) Only redirect to "/" when session is known to be null,
  //    and *not* when landing on the OAuth callback tab.
  useEffect(() => {
    if (sessionObj === undefined) return;  // still loading
    const isAccountTab = searchParams.get('tab') === 'account';
    if (sessionObj === null && !isAccountTab) {
      router.replace('/');
    }
  }, [sessionObj, searchParams, router]);

  // 2) Once we have a session, check whether they need to set a password:
  //    either they signed up via Google and haven't set one, or they have no email identity.
  useEffect(() => {
    if (sessionObj === undefined || sessionObj === null) return;

    const { identities = [], user_metadata = {} } = sessionObj.user;
    const hasEmail    = identities.some(i => i.provider === 'email');
    const passwordSet = user_metadata.passwordSet === true;

    const needs = !(hasEmail || passwordSet);
    setNeedsPasswordSetup(needs);

    if (needs) {
      // force the account tab for those who still need a password
      setTab('account');
    }
  }, [sessionObj]);

  // 3) Once we know needsPasswordSetup, bounce non-OAuth users off "account" tab
  useEffect(() => {
    if (needsPasswordSetup === undefined) return;
    if (!needsPasswordSetup && searchParams.get('tab') === 'account') {
      router.replace('/dashboard');
    }
  }, [needsPasswordSetup, searchParams, router]);

  // 4) Load team invites when viewing the invitations tab
  useEffect(() => {
    if (tab !== 'invitations') return;
    supabase
      .from('invites')
      .select('email, sent_at')
      .eq('accepted', true)
      .then(({ data, error }) => {
        if (!error && data) setTeam(data);
      });
  }, [tab, supabase]);

  // Handle setting or changing the password, and tag the user metadata
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
    const { error: pwErr } = await supabase.auth.updateUser({
      password: newPw,
      data: { passwordSet: true },    // ← record that they’ve now set a password
    });
    setLoading(false);

    if (pwErr) {
      setError(pwErr.message);
    } else {
      setSuccess('Password updated successfully.');
      setNewPw('');
      setConfirmPw('');
      // now they no longer need a password
      setNeedsPasswordSetup(false);
      router.replace('/dashboard');
    }
  };

  // Wait until session and needsPasswordSetup are resolved
  if (
    sessionObj === undefined ||
    needsPasswordSetup === undefined
  ) {
    return null;
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {needsPasswordSetup && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800">
          You signed up via Google. Please set a password below so you can also
          log in with email/password.
        </div>
      )}

      <nav className="flex space-x-4 border-b mb-6">
        <button
          onClick={() => setTab('invitations')}
          className={`pb-2 ${
            tab === 'invitations'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Team Invitations
        </button>
        <button
          onClick={() => setTab('account')}
          className={`pb-2 ${
            tab === 'account'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Account Management
        </button>
      </nav>

      {tab === 'invitations' && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Invite Teammates</h2>
          <InviteUsers />
        </section>
      )}

      {tab === 'account' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {needsPasswordSetup ? 'Set Your Password' : 'Change Password'}
            </h2>
            <div className="bg-white shadow rounded-lg p-6 max-w-md">
              <label className="block mb-3">
                <span className="text-gray-700">
                  New Password{!needsPasswordSetup && ' *'}
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
              <label className="block mb-4">
                <span className="text-gray-700">
                  Confirm Password{!needsPasswordSetup && ' *'}
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
              <button
                onClick={handleSet}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? needsPasswordSetup
                    ? 'Setting…'
                    : 'Updating…'
                  : needsPasswordSetup
                  ? 'Set Password'
                  : 'Change Password'}
              </button>
              {error   && <p className="text-red-500 mt-2">{error}</p>}
              {success && <p className="text-green-600 mt-2">{success}</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mt-8 mb-2">Team Members</h2>
            {team.length > 0 ? (
              <ul className="list-disc pl-5">
                {team.map(m => (
                  <li key={m.email}>
                    {m.email} — joined on {new Date(m.sent_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No active members yet.</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
