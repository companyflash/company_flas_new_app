'use client'

import { useState, useEffect } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter, usePathname } from 'next/navigation'

export default function Home() {
  const supabase = useSupabaseClient()
  const session  = useSession()
  const router   = useRouter()
  const path     = usePathname()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<'sign-in' | 'sign-up'>('sign-in')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  // If we detect a session on "/", send to /dashboard once
  useEffect(() => {
    if (session && path === '/') {
      router.replace('/dashboard')
    }
  }, [session, path, router])

  const handleEmailAuth = async () => {
    setError(null)
    setLoading(true)
    try {
      if (mode === 'sign-up') {
        const { error: signErr } = await supabase.auth.signUp({ email, password })
        if (signErr) throw signErr
        await fetch('/api/onboard', { method: 'POST' })
        setError('Check your email for a confirmation link—your business has been created.')
      } else {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signErr) throw signErr
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async () => {
    setError(null)
    // Ask Supabase for the OAuth URL
    const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (oauthErr) {
      setError(oauthErr.message)
      return
    }
    if (data?.url) {
      // actually redirect the browser
      window.location.href = data.url
    } else {
      setError('Could not get OAuth redirect URL.')
    }
  }

  // Don’t flash the login form if already signed in
  if (session) return null

  return (
    <main className="flex flex-col items-center justify-center min-h-screen space-y-8 px-4">
      <h1 className="text-4xl font-extrabold">CompanyFlash</h1>
      <p className="max-w-md text-center">
        An end-to-end fraud-prevention and risk-intelligence platform that scores suppliers,
        surfaces results in your workflow, and gives finance teams audit-ready history.
      </p>

      <div className="space-x-2">
        <button
          onClick={() => setMode('sign-in')}
          className={`px-4 py-2 rounded ${mode === 'sign-in' ? 'bg-blue-600 text-white' : 'border'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('sign-up')}
          className={`px-4 py-2 rounded ${mode === 'sign-up' ? 'bg-blue-600 text-white' : 'border'}`}
        >
          Sign Up
        </button>
      </div>

      <div className="flex flex-col space-y-2 w-full max-w-sm">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="px-3 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="px-3 py-2 border rounded"
        />
        <button
          onClick={handleEmailAuth}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {loading
            ? mode === 'sign-up'
              ? 'Creating…'
              : 'Signing In…'
            : mode === 'sign-up'
            ? 'Create Account'
            : 'Sign In'}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="flex items-center w-full max-w-sm">
        <hr className="flex-grow" />
        <span className="px-2 text-gray-500">OR</span>
        <hr className="flex-grow" />
      </div>

      <button
        onClick={handleOAuth}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Sign in with Google
      </button>
    </main>
  )
}
