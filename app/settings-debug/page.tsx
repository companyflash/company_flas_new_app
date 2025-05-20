'use client';
import { useEffect, useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useSearchParams } from 'next/navigation';

export default function SettingsDebug() {
  const session = useSession();
  const params  = useSearchParams();
  const tab     = params.get('tab');
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    setLog(l => [
      ...l,
      `session = ${session === undefined
         ? 'undefined'
         : session === null
           ? 'null'
           : '✔️ user-id='+session.user.id
      }`
    ]);
  }, [session]);

  useEffect(() => {
    setLog(l => [...l, `?tab = ${tab}`]);
  }, [tab]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Settings Debug</h1>
      <p>Stay on this page—nothing here redirects.</p>
      <pre className="bg-gray-100 p-4 rounded">
        {log.map((line, i) => <div key={i}>{line}</div>)}
      </pre>
      <p className="mt-4 text-sm text-gray-500">
        Use <code>/settings-debug?tab=account</code> after logging in via Google.
      </p>
    </div>
  );
}
