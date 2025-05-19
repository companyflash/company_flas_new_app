'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, FileText, Users, LockOpen } from 'lucide-react'
import { FaGoogle } from 'react-icons/fa'

export default function LandingPage() {
  const supabase = useSupabaseClient()
  const session  = useSession()
  const router   = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string|null>(null)
  const [loading, setLoading]   = useState(false)

  // Redirect if already signed in
  useEffect(() => {
    if (session) {
      router.replace('/dashboard')
    }
  }, [session, router])

  // Do not render until session status is known
  if (session === undefined) {
    return null
  }

  // If signed in, don't render the form (effect will redirect)
  if (session) {
    return null
  }

  const handleSignIn = async () => {
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else router.push('/dashboard')
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
  }

  return (
    <>
      {/* Header */}
      <header className="flex justify-end p-4 bg-white shadow">
        <span className="mr-4 text-gray-700">Don&apos;t have an account?</span>
        <Link
          href="/signup"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Get Started
        </Link>
      </header>

      {/* Hero Section */}
      <main className="bg-gray-50">
        <section className="text-center py-16">
          <h1 className="text-4xl font-extrabold mb-4">End-to-end Fraud Prevention</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Score suppliers, surface results in your workflow, and give finance teams
            audit-ready history.
          </p>
        </section>

        {/* Sign-In Box */}
        <section className="flex justify-center mb-16 px-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full space-y-6">
            <h2 className="flex items-center justify-center text-3xl font-bold">
              <LockOpen className="w-8 h-8 text-blue-600 mr-2" />
              Sign In
            </h2>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="flex items-center justify-center space-x-2 text-gray-500">or</div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              <FaGoogle className="w-5 h-5 mr-2 text-red-600" />
              Sign in with Google
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <ShieldAlert className="mx-auto mb-4 w-12 h-12 text-blue-600" />
            <h3 className="text-xl font-semibold mb-2">Risk Intelligence</h3>
            <p className="text-gray-600">
              Get real-time risk scores and audit-ready history for every supplier.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <FileText className="mx-auto mb-4 w-12 h-12 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">Seamless Reports</h3>
            <p className="text-gray-600">
              Generate and share fraud-prevention reports in seconds.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Users className="mx-auto mb-4 w-12 h-12 text-purple-600" />
            <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
            <p className="text-gray-600">
              Invite your team, assign roles, and streamline workflows.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          © {new Date().getFullYear()} CompanyFlash. All rights reserved.
        </div>
      </footer>
    </>
  )
}
