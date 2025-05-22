'use client';

import { useEffect, useState } from 'react';
import { useSession }           from '@supabase/auth-helpers-react';
import { useRouter }            from 'next/navigation';

export default function OAuthCallbackPage() {
  const session = useSession();
  const router  = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // surface any error from the OAuth redirect
  useEffect(() => {
    const err = new URL(window.location.href)
      .searchParams
      .get('error_description');
    if (err) {
      setErrorMsg(decodeURIComponent(err));
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    const { identities = [], user_metadata = {} } = session.user;
    const hasEmail = identities.some(i => i.provider === 'email');
    const pwSet    = user_metadata.passwordSet === true;
    const invited  = Boolean(user_metadata.invited);

    if (hasEmail || pwSet || invited) {
      // anyone with an email‐login identity, a set password, OR who was invited
      // goes straight to the dashboard
      router.replace('/dashboard');
    } else {
      // fresh OAuth users need to run through company onboarding
      router.replace('/onboarding/company');
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
