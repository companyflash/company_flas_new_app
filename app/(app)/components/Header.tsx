'use client';

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UserMetadata {
  avatar_url?: string;
}

export function Header() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!session) return null;

  const { user } = session;
  const metadata = (user.user_metadata ?? {}) as UserMetadata;
  const avatarUrl = metadata.avatar_url ?? '/default-avatar.png';
  const email = user.email;

  return (
    <header className="flex items-center justify-between p-4 bg-gray-100 shadow-sm">
      <div className="flex items-center space-x-3">
        <Image
          src={avatarUrl}
          alt="Your avatar"
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="font-medium">{email}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Sign Out
      </button>
    </header>
  );
}
