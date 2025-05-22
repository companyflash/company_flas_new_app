'use client';

import { useEffect, useState } from 'react';
import {
  useSupabaseClient,
  useSession,
} from '@supabase/auth-helpers-react';
import {
  useRouter,
  usePathname,
} from 'next/navigation';
import Link from 'next/link';
import { LockOpen } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

export default function LandingPage() {
  const supabase = useSupabaseClient();
  const session  = useSession();
  const router   = useRouter();
  const path     = usePathname();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // Kick off Google OAuth via client-side callback flow
  const handleGoogleSignIn = async () => {
    console.log('[LANDING] Google sign-in clicked');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
  };

  // Only on "/" do we auto-redirect once session is known
  useEffect(() => {
    if (session === undefined) return;
    if (path !== '/') return;

    console.log('[LANDING] session changed on root:', session);

    if (session) {
      // Email/password users go directly to dashboard
      router.replace('/dashboard');
    }
  }, [session, path, router]);

  // While loading session or immediately after arriving on "/", render nothing
  if (session === undefined || (session && path === '/')) {
    return null;
  }

  // Otherwise show the landing / sign-in UI
  return (
    <>
      <header className="flex justify-end p-4 bg-white shadow">
        <span className="mr-4 text-gray-700">Don&apos;t have an account?</span>
        <Link
          href="/signup"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Get Started
        </Link>
      </header>

      <main className="bg-gray-50">
        {/* Hero Section */}
        <section className="text-center py-16">
          <h1 className="text-4xl font-extrabold mb-4">
            End-to-end Fraud Prevention
          </h1>
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
              onClick={async () => {
                setError(null);
                setLoading(true);
                const { error: pwErr } = await supabase.auth.signInWithPassword({ email, password });
                setLoading(false);
                if (pwErr) {
                  setError(pwErr.message);
                } else {
                  router.replace('/dashboard');
                }
              }}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <hr className="flex-grow border-gray-300" />
              <span>or</span>
              <hr className="flex-grow border-gray-300" />
            </div>

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
        {/* … your existing feature cards here … */}
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          © {new Date().getFullYear()} CompanyFlash. All rights reserved.
        </div>
      </footer>
    </>
  );
}
