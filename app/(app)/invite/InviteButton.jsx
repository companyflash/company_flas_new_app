'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InviteButton({ businessId }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!email) return setError('Email required')
    setLoading(true)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    })
    const body = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(body.error || 'Invite failed')
    } else {
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-x-2">
      <input
        type="email"
        placeholder="Invitee email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border rounded px-2 py-1"
      />
      <select
        value={role}
        onChange={e => setRole(e.target.value)}
        className="border rounded px-2 py-1"
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
      >
        {loading ? 'Inviting…' : 'Invite'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  )
}
