'use client';

import { useState } from 'react';

export function InviteUsers() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'sending' | 'sent' | 'error' | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(null);

  const handleSend = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || res.statusText);

      setSentAt(new Date(body.sent_at).toLocaleString());
      setStatus('sent');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      {status === 'sent' ? (
        <p className="text-green-600">Invite sent at {sentAt}</p>
      ) : (
        <>
          <div>
            <label className="block mb-1">Teammate Email</label>
            <input
              type="email"
              className="border rounded px-3 py-2 w-full"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={status === 'sending' || !email}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : 'Send Invite'}
          </button>
          {status === 'error' && <p className="text-red-500">Failed to send invite</p>}
        </>
      )}
    </div>
  );
}
