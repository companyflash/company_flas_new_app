'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { FaGoogle } from 'react-icons/fa';

export default function GenericSignupForm() {
  const supabase = useSupabaseClient();
  const router   = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // Email/password signup
  const handleEmailSignup = async () => {
    setError(null);
    setLoading(true);
    const { error: supErr } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (supErr) {
      setError(supErr.message);
    } else {
      // Email users go straight to dashboard
      router.replace('/dashboard');
    }
  };

  // Google OAuth signup → client callback → Settings
  const handleGoogle = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Pass them to the client-side callback page
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <h2 className="text-2xl font-semibold text-center">Create Your Account</h2>

      {error && <p className="text-red-500 text-center">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="••••••••"
          />
        </div>

        <button
          onClick={handleEmailSignup}
          disabled={loading || !email || !password}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Signing up…' : 'Sign up with email'}
        </button>
      </div>

      <div className="flex items-center my-4">
        <hr className="flex-grow border-gray-300" />
        <span className="px-2 text-gray-500">or</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full border py-2 rounded flex items-center justify-center hover:bg-gray-100"
      >
        <FaGoogle className="mr-2 h-5 w-5 text-red-500" />
        Continue with Google
      </button>
    </div>
  );
}
