'use client'

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { InviteUsers } from '@/app/(app)/components/InviteUsers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SettingsPage() {
  const session = useSession()
  const router = useRouter()

  // If not signed in, bounce to home
  useEffect(() => {
    if (session === null) {
      router.replace('/')
    }
  }, [session, router])

  if (!session) return null

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Team Invitations</h2>
        <InviteUsers />
      </section>

      {/* You can add other settings here */}
    </main>
  )
}
