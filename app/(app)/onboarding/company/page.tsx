'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CompanyOnboardingPage() {
  const supabase = createClientComponentClient();
  const router   = useRouter();

  const [name, setName]         = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize]         = useState<'1-10'|'11-50'|'51-200'|'201+'|''>('');
  const [token, setToken]       = useState<string|null>(null);
  const [error, setError]       = useState<string|null>(null);
  const [loading, setLoading]   = useState(false);

  // Grab the access token once session loads
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('[Onboarding UI] session:', session);
        setToken(session?.access_token ?? null);
      });
  }, [supabase]);

  const handleSubmit = async () => {
    console.log('[Onboarding UI] submitting with token:', token);
    if (!token) {
      setError('Still fetching authentication—please wait a moment.');
      return;
    }
    if (!name.trim() || !industry || !size) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    const res = await fetch('/api/onboarding/company', {
      method:      'POST',
      headers:     {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, industry, size }),
    });

    console.log('[Onboarding UI] response status:', res.status);
    const body = await res.json().catch(() => ({}));
    console.log('[Onboarding UI] response body:', body);

    setLoading(false);

    if (!res.ok) {
      setError(body.error || 'Failed to create company.');
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <main className="max-w-lg mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Tell us about your company</h1>
      {error && <p className="text-red-500">{error}</p>}

      {/* Name */}
      <div>
        <label className="block mb-1">Company Name</label>
        <input
          type="text" value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Industry */}
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

      {/* Size */}
      <div>
        <label className="block mb-1">Company Size</label>
        <div className="flex gap-4">
          {['1-10','11-50','51-200','201+'].map(s => (
            <label key={s} className="inline-flex items-center">
              <input
                type="radio"
                name="size"
                value={s}
                checked={size===s}
                onChange={() => setSize(s as typeof size)}
                className="mr-1"
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !token}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </main>
  );
}
