'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function InvitePage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin'|'member'>('member')
  const [error, setError] = useState<string|null>(null)

  // fetch invite details
  useEffect(() => {
    if (!token) return
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(inv => {
        if (inv.error) { setError(inv.error); return }
        setEmail(inv.email)
        setRole(inv.role)
      })
  }, [token])

  const handleSignup = async () => {
    const { error: signErr } = await supabase.auth.signUp({ email, password })
    if (signErr) { setError(signErr.message); return }
    // accept invite
    await fetch(`/api/invite/${token}/accept`, { method: 'POST' })
    router.push('/')
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">You’re invited as {role}</h1>
      {error && <p className="text-red-500">{error}</p>}
      <label>Email</label>
      <input type="email" value={email} readOnly className="w-full mb-2 p-2 border" />
      <label>Password</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mb-4 p-2 border" />
      <button onClick={handleSignup} className="px-4 py-2 bg-green-600 text-white rounded">Create Account</button>
    </main>
  )
}
