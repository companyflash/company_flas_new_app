'use client'

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SetPassword } from '@/app/(app)/components/SetPassword'

export default function DashboardPage() {
  const supabase = useSupabaseClient()
  const session  = useSession()
  const router   = useRouter()
  const path     = usePathname()

  const [role, setRole]         = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState(false)

  useEffect(() => {
    if (session === undefined) return
    if (session === null && path === '/dashboard') {
      router.replace('/')
      return
    }
    if (session && path === '/dashboard') {
      setLoadingRole(true)
      supabase
        .from('business_members')
        .select('role')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => setRole(data?.role ?? 'member'))
        .finally(() => setLoadingRole(false))
    }
  }, [session, path, router, supabase])

  if (session === undefined || session === null || loadingRole) return null

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-12">
      {/* Welcome / Role */}
      <div className="bg-white shadow-md rounded-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* … */}
      </div>

      {/* Overview */}
      <section>{/* … */}</section>

      {/* Team Invitations */}
      <section>{/* … */}</section>

      {/* ← Here’s the SetPassword UI */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <SetPassword />
      </section>
    </main>
  )
}
