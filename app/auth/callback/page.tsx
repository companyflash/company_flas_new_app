// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter }  from 'next/navigation';

export default function OAuthCallbackPage() {
  const session = useSession();
  const router  = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Did the OAuth flow report an error?
    const err = new URL(window.location.href)
      .searchParams
      .get('error_description');
    if (err) {
      setErrorMsg(decodeURIComponent(err));
    }
  }, []);

  useEffect(() => {
    // Wait until session is populated
    if (!session) return;

    // Once we have a session, decide where to go:
    const { identities = [], user_metadata = {} } = session.user;
    const hasEmail   = identities.some(i => i.provider === 'email');
    const pwSet      = user_metadata.passwordSet === true;

    if (hasEmail || pwSet) {
      // Already have a password → dashboard
      router.replace('/dashboard');
    } else {
      // Need to set a password → settings tab=account
      router.replace('/settings?tab=account');
    }
  }, [session, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      {errorMsg
        ? <p className="text-red-500">{errorMsg}</p>
        : <p className="text-gray-700">Finishing login…</p>
      }
    </div>
  );
}
