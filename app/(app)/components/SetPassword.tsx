// components/SetPassword.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'

export function SetPassword() {
  const supabase = useSupabaseClient()
  const session  = useSession()

  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  // Optional: detect if user already has an email/password identity
  useEffect(() => {
    (async () => {
      const { data: user, error } = await supabase.auth.getUser()
      if (!error && user) {
        // identities is an array; look for provider === 'email'
        const passIdentity = (user.identities ?? []).find(id => id.provider === 'email')
        setHasPassword(!!passIdentity)
      }
    })()
  }, [supabase])

  if (!session) return null

  // If they already have a password, offer “Change password” instead
  const heading = hasPassword
    ? 'Change Password'
    : 'Set a Password for Email/Password Login'

  const handle = async () => {
    setError(null)
    setSuccess(null)

    if (newPw.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPw !== confirmPw) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password saved! You can now log in with email + password.')
      setNewPw('')
      setConfirmPw('')
      // If this was their first password, update state
      if (hasPassword === false) setHasPassword(true)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-sm mx-auto space-y-4">
      <h3 className="text-lg font-semibold">{heading}</h3>
      <input
        type="password"
        placeholder="New password"
        value={newPw}
        onChange={e => setNewPw(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPw}
        onChange={e => setConfirmPw(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />
      <button
        onClick={handle}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Saving…' : hasPassword ? 'Change Password' : 'Set Password'}
      </button>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}
    </div>
  )
}
