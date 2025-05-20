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
  const sessionObj = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = ['invitations', 'account', 'company'].includes(searchParams.get('tab')!)
    ? (searchParams.get('tab')! as 'invitations' | 'account' | 'company')
    : 'invitations';
  const [tab, setTab] = useState(initialTab);

  const [needsPasswordSetup, setNeedsPasswordSetup] = useState<boolean | undefined>(undefined);

  // Password state
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Team
  const [team, setTeam] = useState<{ email: string; sent_at: string }[]>([]);

  // Company
  const [company, setCompany] = useState<{ id: string; name: string; industry: string; size: string } | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editFields, setEditFields] = useState({ name: '', industry: '', size: '' });

  // Redirect logic
  useEffect(() => {
    if (sessionObj === undefined) return;
    const isAccountTab = searchParams.get('tab') === 'account';
    if (sessionObj === null && !isAccountTab) router.replace('/');
  }, [sessionObj, searchParams, router]);

  // Check password setup
  useEffect(() => {
    if (!sessionObj) return;
    const { identities = [], user_metadata = {} } = sessionObj.user;
    const hasEmail = identities.some(i => i.provider === 'email');
    const passwordSet = user_metadata.passwordSet;
    const needs = !(hasEmail || passwordSet);
    setNeedsPasswordSetup(needs);
    if (needs) setTab('account');
  }, [sessionObj]);

  // Redirect account
  useEffect(() => {
    if (needsPasswordSetup === false && tab === 'account') router.replace('/dashboard');
  }, [needsPasswordSetup, tab, router]);

  // Load team
  useEffect(() => {
    if (tab !== 'invitations') return;
    supabase
      .from('invites')
      .select('email, sent_at')
      .eq('accepted', true)
      .then(({ data }) => data && setTeam(data));
  }, [tab, supabase]);

  // Load company
  useEffect(() => {
    if (tab !== 'company') return;
    setCompanyLoading(true);
    supabase
      .from('businesses')
      .select('id,name,industry,size')
      .single()
      .then(({ data, error }) => {
        if (error) setCompanyError(error.message);
        else if (data) {
          setCompany(data);
          setEditFields({ name: data.name, industry: data.industry, size: data.size });
        }
      })
      .finally(() => setCompanyLoading(false));
  }, [tab, supabase]);

  const handleSetPassword = async () => {
    setPwError(null);
    setPwSuccess(null);
    if (newPw.length < 6) return setPwError('At least 6 characters.');
    if (newPw !== confirmPw) return setPwError('Passwords do not match.');
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw, data: { passwordSet: true } });
    setPwLoading(false);
    if (error) setPwError(error.message);
    else {
      setPwSuccess('Password updated.');
      setNeedsPasswordSetup(false);
      router.replace('/dashboard');
    }
  };

  const handleSaveCompany = async () => {
    if (!company) return;
    setCompanyError(null);
    setCompanyLoading(true);
    const { name, industry, size } = editFields;
    const { error } = await supabase
      .from('businesses')
      .update({ name, industry, size })
      .eq('id', company.id);
    setCompanyLoading(false);
    if (error) setCompanyError(error.message);
    else {
      setCompany({ ...company, name, industry, size });
      setIsEditingCompany(false);
    }
  };

  if (sessionObj === undefined || needsPasswordSetup === undefined) return null;

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <nav className="flex space-x-4 border-b mb-6">
        <button onClick={() => setTab('invitations')} className={tab==='invitations'? 'pb-2 border-b-2 border-blue-600 text-blue-600':'pb-2 text-gray-600 hover:text-gray-800'}>Team Invitations</button>
        <button onClick={() => setTab('account')} className={tab==='account'? 'pb-2 border-b-2 border-blue-600 text-blue-600':'pb-2 text-gray-600 hover:text-gray-800'}>Account Management</button>
        <button onClick={() => setTab('company')} className={tab==='company'? 'pb-2 border-b-2 border-blue-600 text-blue-600':'pb-2 text-gray-600 hover:text-gray-800'}>Company Info</button>
      </nav>

      {tab==='invitations' && <InviteUsers confirmBeforeSend />}

      {tab==='account' && (
        <section className="space-y-6">
          {needsPasswordSetup && <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800">Set a password to enable email login.</div>}
          <div className="bg-white shadow rounded-lg p-6 max-w-md space-y-4">
            <h2 className="text-xl font-semibold">{needsPasswordSetup? 'Set Password':'Change Password'}</h2>
            <input type="password" placeholder="New Password" value={newPw} onChange={e=>setNewPw(e.target.value)} className="w-full border rounded px-3 py-2" />
            <input type="password" placeholder="Confirm Password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} className="w-full border rounded px-3 py-2" />
            <button onClick={handleSetPassword} disabled={pwLoading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">{pwLoading? 'Saving...':'Save Password'}</button>
            {pwError && <p className="text-red-500">{pwError}</p>}
            {pwSuccess && <p className="text-green-600">{pwSuccess}</p>}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Team Members</h2>
            {team.length? (
              <ul className="list-disc pl-5">{team.map(m=><li key={m.email}>{m.email} joined {new Date(m.sent_at).toLocaleDateString()}</li>)}</ul>
            ):(<p>No members.</p>)}
          </div>
        </section>
      )}

      {tab==='company' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Company Info</h2>
            <button onClick={()=>setIsEditingCompany(!isEditingCompany)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
              {isEditingCompany? 'Cancel':'Edit'}
            </button>
          </div>
          {companyLoading? <p>Loading...</p> : companyError? <p className="text-red-500">{companyError}</p> : company && (
            <div className="bg-white shadow rounded-lg p-6 max-w-md space-y-4">
              {isEditingCompany? (
                <>
                  <label className="block"><span className="text-gray-700">Name</span><input type="text" value={editFields.name} onChange={e=>setEditFields({...editFields,name:e.target.value})} className="w-full border rounded px-3 py-2" /></label>
                  <label className="block"><span className="text-gray-700">Industry</span><input type="text" value={editFields.industry} onChange={e=>setEditFields({...editFields,industry:e.target.value})} className="w-full border rounded px-3 py-2" /></label>
                  <label className="block"><span className="text-gray-700">Size</span><input type="text" value={editFields.size} onChange={e=>setEditFields({...editFields,size:e.target.value})} className="w-full border rounded px-3 py-2" /></label>
                  <button onClick={handleSaveCompany} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Confirm</button>
                </>
              ) : (
                <>
                  <p><strong>Name:</strong> {company.name}</p>
                  <p><strong>Industry:</strong> {company.industry}</p>
                  <p><strong>Size:</strong> {company.size}</p>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
