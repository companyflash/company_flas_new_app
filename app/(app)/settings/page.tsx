// app/(app)/settings/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  useSession,
  useSupabaseClient,
} from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { InviteUsers } from '../components/InviteUsers';

type Tab = 'invitations' | 'account' | 'company';

interface Company {
  id:       string;
  name:     string;
  industry: string;
  size:     string;
}

export default function SettingsPage() {
  const session      = useSession();
  const supabase     = useSupabaseClient();
  const router       = useRouter();

  // replace useSearchParams:
  const [inviteToken, setInviteToken] = useState<string|null>(null);
  const [tab, setTab]                 = useState<Tab>('invitations');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteToken(params.get('inviteToken'));
    const p = params.get('tab');
    if (p === 'invitations' || p === 'account' || p === 'company') {
      setTab(p);
    }
  }, []);

  // PASSWORD STATE
  const [needsPassword, setNeedsPassword] = useState<boolean|undefined>(undefined);
  const [newPw, setNewPw]                 = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [pwError, setPwError]             = useState<string|null>(null);
  const [pwSuccess, setPwSuccess]         = useState<string|null>(null);
  const [pwLoading, setPwLoading]         = useState(false);

  // COMPANY STATE
  const [company,        setCompany]        = useState<Company|null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError,   setCompanyError]   = useState<string|null>(null);
  const [isEditing,      setIsEditing]      = useState(false);
  const [fields, setFields] = useState<{ name:string; industry:string; size:string }>({
    name: '', industry: '', size: ''
  });

  // 0) Auto-accept invite if token & session
  useEffect(() => {
    if (!inviteToken || !session) return;
    (async () => {
      const res = await fetch(`/api/invite/${inviteToken}/accept`, { method: 'POST' });
      if (res.ok) {
        router.replace('/settings?tab=account');
      } else {
        console.error('Invite acceptance failed:', await res.text());
      }
    })();
  }, [inviteToken, session, router]);

  // 1) Redirect if not logged in (except on Account)
  useEffect(() => {
    if (session === undefined) return;
    if (session === null && tab !== 'account') {
      router.replace('/');
    }
  }, [session, tab, router]);

  // 2) Check whether user must set a password
  useEffect(() => {
    if (!session) return;
    const { identities = [], user_metadata = {} } = session.user;
    const hasEmail = identities.some(i => i.provider === 'email');
    const pwSet    = Boolean(user_metadata.passwordSet);
    const invited  = Boolean(user_metadata.invited);
    const needs    = !invited && !(hasEmail || pwSet);
    setNeedsPassword(needs);
    if (needs) setTab('account');
  }, [session]);

  // 3) Change password handler
  const handleSetPassword = async () => {
    setPwError(null);
    setPwSuccess(null);
    if (newPw.length < 6) {
      setPwError('At least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match.');
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPw,
      data:     { passwordSet: true },
    });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess('Password updated.');
      setNeedsPassword(false);
    }
  };

  // 4) Load company info on Company tab
  useEffect(() => {
    if (tab !== 'company' || !session) return;
    (async () => {
      setCompanyLoading(true);
      try {
        const { data: membership, error: memErr } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', session.user.id)
          .single();
        if (memErr || !membership) throw memErr || new Error('No company found');

        const { data: biz, error: bizErr } = await supabase
          .from('businesses')
          .select('id,name,industry,size')
          .eq('id', membership.business_id)
          .single();
        if (bizErr || !biz) throw bizErr || new Error('Business not found');

        setCompany(biz);
        setFields({ name: biz.name, industry: biz.industry, size: biz.size });
      } catch (err: unknown) {
        setCompanyError((err as Error).message);
      } finally {
        setCompanyLoading(false);
      }
    })();
  }, [tab, session, supabase]);

  // 5) Save edited company info
  const handleSaveCompany = async () => {
    if (!company) return;
    setCompanyLoading(true);
    setCompanyError(null);
    try {
      const { name, industry, size } = fields;
      const { error } = await supabase
        .from('businesses')
        .update({ name, industry, size })
        .eq('id', company.id);
      if (error) throw error;
      setCompany({ id: company.id, name, industry, size });
      setIsEditing(false);
    } catch (err: unknown) {
      setCompanyError((err as Error).message);
    } finally {
      setCompanyLoading(false);
    }
  };

  if (needsPassword === undefined) return null;

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <nav className="flex space-x-4 border-b mb-6">
        <button
          onClick={() => setTab('invitations')}
          className={
            tab === 'invitations'
              ? 'pb-2 border-b-2 border-blue-600 text-blue-600'
              : 'pb-2 text-gray-600 hover:text-gray-800'
          }
        >
          Team Invitations
        </button>
        <button
          onClick={() => setTab('account')}
          className={
            tab === 'account'
              ? 'pb-2 border-b-2 border-blue-600 text-blue-600'
              : 'pb-2 text-gray-600 hover:text-gray-800'
          }
        >
          Account Management
        </button>
        <button
          onClick={() => setTab('company')}
          className={
            tab === 'company'
              ? 'pb-2 border-b-2 border-blue-600 text-blue-600'
              : 'pb-2 text-gray-600 hover:text-gray-800'
          }
        >
          Company Info
        </button>
      </nav>

      {tab === 'invitations' && <InviteUsers />}

      {tab === 'account' && (
        <section className="space-y-6">
          {needsPassword && (
            <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800">
              Set a password to enable email login.
            </div>
          )}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {needsPassword ? 'Set Password' : 'Change Password'}
            </h2>
            <input
              type="password"
              placeholder="New Password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            <button
              onClick={handleSetPassword}
              disabled={pwLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {pwLoading ? 'Saving…' : 'Save Password'}
            </button>
            {pwError   && <p className="text-red-500">{pwError}</p>}
            {pwSuccess && <p className="text-green-600">{pwSuccess}</p>}
          </div>
        </section>
      )}

      {tab === 'company' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Company Info</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {companyLoading
            ? <p>Loading…</p>
            : companyError
              ? <p className="text-red-500">{companyError}</p>
              : company && (
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <label className="block">
                        <span className="text-gray-700">Name</span>
                        <input
                          type="text"
                          value={fields.name}
                          onChange={e => setFields({ ...fields, name: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-700">Industry</span>
                        <input
                          type="text"
                          value={fields.industry}
                          onChange={e => setFields({ ...fields, industry: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-700">Size</span>
                        <input
                          type="text"
                          value={fields.size}
                          onChange={e => setFields({ ...fields, size: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        />
                      </label>
                      <button
                        onClick={handleSaveCompany}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Confirm
                      </button>
                    </>
                  ) : (
                    <>
                      <p><strong>Name:</strong> {company.name}</p>
                      <p><strong>Industry:</strong> {company.industry}</p>
                      <p><strong>Size:</strong> {company.size}</p>
                    </>
                  )}
                </div>
              )
          }
        </section>
      )}
    </main>
  );
}
