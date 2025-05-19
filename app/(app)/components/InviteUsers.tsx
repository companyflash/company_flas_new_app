'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InviteUsers() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin'|'member'>('member')
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string|null>(null)

  const sendInvite = async () => {
    setStatus('sending')
    setErrorMsg(null)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    })
    const { error } = await res.json()

    if (error) {
      setErrorMsg(error)
      setStatus('error')
    } else {
      setStatus('sent')
      setEmail('')
    }
  }

  return (
    <div className="p-4 border rounded shadow-sm max-w-md">
      <h2 className="text-lg font-semibold mb-2">Invite a Teammate</h2>
      <div className="flex flex-col space-y-2">
        <input
          type="email"
          placeholder="Teammate’s email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value as any)}
          className="border p-2 rounded"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
        <button
          onClick={sendInvite}
          disabled={!email || status==='sending'}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {status === 'sending'
            ? 'Sending…'
            : status === 'sent'
            ? 'Invite Sent!'
            : 'Send Invite'}
        </button>
        {status === 'error' && (
          <p className="text-red-500 text-sm">Error: {errorMsg}</p>
        )}
      </div>
    </div>
  )
}
