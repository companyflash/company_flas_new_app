// app/api/auth/[...supabase]/route.ts
import { handleAuth } from '@supabase/auth-helpers-nextjs';

export const runtime = 'edge';

export default handleAuth({
  callbacks: {
    async signIn({ account }) {
      // OAuth logins → settings
      if (account?.provider !== 'email') {
        return '/settings?tab=account';
      }
      // email/password → dashboard
      return '/dashboard';
    }
  }
});
