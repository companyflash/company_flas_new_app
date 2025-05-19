'use client'

import { useState, useEffect } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { InviteUsers } from '@/app/(app)/components/InviteUsers'

export default function SettingsPage() {
  const session       = useSession()
  const supabase      = useSupabaseClient()
  const router        = useRouter()
  const [tab, setTab] = useState<'invitations' | 'account'>('invitations')

  // Redirect if not signed in
  useEffect(() => {
    if (session === null) router.replace('/')
  }, [session, router])

  // Change Password state
  const [newPw, setNewPw]         = useState<string>('')
  const [confirmPw, setConfirmPw] = useState<string>('')
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)
  const [loading, setLoading]     = useState<boolean>(false)

  const handleSet = async () => {
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
      setSuccess('Password updated successfully.')
      setNewPw('')
      setConfirmPw('')
    }
  }

  if (!session) return null

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <nav className="flex space-x-4 border-b mb-6">
        <button
          onClick={() => setTab('invitations')}
          className={`pb-2 ${
            tab === 'invitations'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Team Invitations
        </button>
        <button
          onClick={() => setTab('account')}
          className={`pb-2 ${
            tab === 'account'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Account Management
        </button>
      </nav>

      {/* Invitations Tab */}
      {tab === 'invitations' && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Invite Teammates</h2>
          <InviteUsers />
        </section>
      )}

      {/* Account Tab */}
      {tab === 'account' && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold mb-2">Change Password</h2>
          <div className="bg-white shadow rounded-lg p-6 max-w-md">
            <label className="block mb-3">
              <span className="text-gray-700">New Password *</span>
              <input
                type="password"
                placeholder="••••••••"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>

            <label className="block mb-4">
              <span className="text-gray-700">Confirm Password *</span>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>

            <button
              onClick={handleSet}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Change Password'}
            </button>

            {error   && <p className="text-red-500 mt-2">{error}</p>}
            {success && <p className="text-green-600 mt-2">{success}</p>}
          </div>
        </section>
      )}
    </main>
  )
}
