'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter }  from 'next/navigation';

export default function OAuthCallbackPage() {
  const session  = useSession();
  const router   = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // As soon as session is populated, redirect into Settings → Account
  useEffect(() => {
    if (session) {
      router.replace('/settings?tab=account');
    }
  }, [session, router]);

  // Catch any error returned in the URL
  useEffect(() => {
    const err = new URL(window.location.href).searchParams.get('error_description');
    if (err) setErrorMsg(decodeURIComponent(err));
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      {errorMsg
        ? <p className="text-red-500">{errorMsg}</p>
        : <p className="text-gray-700">Finishing login…</p>
      }
    </div>
  );
}
