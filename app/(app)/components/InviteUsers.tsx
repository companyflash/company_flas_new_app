// app/components/InviteUsers.tsx
'use client';

import { useState } from 'react';

export function InviteUsers() {
  const [email, setEmail]     = useState('');
  const [role, setRole]       = useState<'admin' | 'member'>('member');
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    setError(null);
    setSuccess(null);
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Invite failed');
      setSuccess(`Invitation sent to ${email} as ${role}.`);
      setEmail('');
      setRole('member');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error   && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <div>
        <label className="block text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="teammate@example.com"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-1">Role</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value as 'admin'|'member')}
          className="w-full border rounded px-3 py-2"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </div>

      <button
        disabled={loading}
        onClick={handleInvite}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send Invite'}
      </button>
    </div>
  );
}
