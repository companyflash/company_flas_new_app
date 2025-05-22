'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function OnboardingPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<'password' | 'company'>('password');
  const [loading, setLoading] = useState(true);

  // Password fields
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Company fields
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState<'1-10' | '11-50' | '51-200' | '201+' | ''>('');
  const [cmpError, setCmpError] = useState<string | null>(null);
  const [cmpLoading, setCmpLoading] = useState(false);

  // Determine session & step
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error || !session) {
          // Not authenticated
          router.replace('/');
          return;
        }
        // explicitly type identities to avoid `any`
        const identities = (session.user.identities ?? []) as { provider: string }[];
        const hasEmail = identities.some(i => i.provider === 'email');
        const pwSet = session.user.user_metadata?.passwordSet;
        setStep(hasEmail || pwSet ? 'company' : 'password');
      } catch (err) {
        console.error('Session fetch error:', err);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase, router]);

  // Password submission
  const handlePasswordSubmit = async () => {
    setPwError(null);
    if (newPw.length < 6) return setPwError('At least 6 characters.');
    if (newPw !== confirmPw) return setPwError('Passwords do not match.');
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPw,
      data: { passwordSet: true },
    });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
    } else {
      setStep('company');
    }
  };

  // Company submission
  const handleCompanySubmit = async () => {
    setCmpError(null);
    if (!name.trim() || !industry || !size) {
      return setCmpError('Please fill in all fields.');
    }
    setCmpLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch('/api/onboarding/company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ name, industry, size }),
    });
    const body = await res.json().catch(() => ({}));
    setCmpLoading(false);
    if (!res.ok) {
      setCmpError(body.error || 'Failed to create company.');
    } else {
      router.replace('/dashboard');
    }
  };

  if (loading) return null;

  return (
    <main className="max-w-lg mx-auto p-8 space-y-6">
      {step === 'password' ? (
        <>
          <h1 className="text-2xl font-bold">Set Your Password</h1>
          {pwError && <p className="text-red-500">{pwError}</p>}
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
            onClick={handlePasswordSubmit}
            disabled={pwLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {pwLoading ? 'Saving…' : 'Continue'}
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Tell Us About Your Company</h1>
          {cmpError && <p className="text-red-500">{cmpError}</p>}
          <div>
            <label className="block mb-1">Company Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Industry</label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select…</option>
              <option>Technology</option>
              <option>Finance</option>
              <option>Healthcare</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Company Size</label>
            <div className="flex gap-4">
              {['1-10', '11-50', '51-200', '201+'].map(s => (
                <label key={s} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="size"
                    value={s}
                    checked={size === s}
                    onChange={() => setSize(s as typeof size)}
                    className="mr-1"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleCompanySubmit}
            disabled={cmpLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {cmpLoading ? 'Saving…' : 'Finish Onboarding'}
          </button>
        </>
      )}
    </main>
  );
}
