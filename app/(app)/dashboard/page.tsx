// app/(app)/dashboard/page.tsx
'use client'

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const supabase = useSupabaseClient()
  const session  = useSession()
  const router   = useRouter()
  const path     = usePathname()

  const [role, setRole]         = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState<boolean>(true)

  useEffect(() => {
    if (session === undefined) return

    if (session === null && path === '/dashboard') {
      router.replace('/')
      return
    }

    if (session && path === '/dashboard') {
      ;(async () => {
        setLoadingRole(true)
        const { data } = await supabase
          .from('business_members')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
        setRole(data?.role ?? 'member')
        setLoadingRole(false)
      })()
    }
  }, [session, path, router, supabase])

  if (session === undefined || session === null || loadingRole) {
    return null
  }

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-12">
      {/* Welcome / Role */}
      <div className="bg-white shadow-md rounded-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome back, {session.user.email}
          </h1>
          <p className="mt-1 text-gray-600">
            Your role: <span className="font-medium text-blue-600">{role}</span>
          </p>
        </div>
        <button
          onClick={() => {/* placeholder action */}}
          className="mt-4 sm:mt-0 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Create New Report
        </button>
      </div>

      {/* Overview */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Overview</h2>
        {/* Metrics grid here */}
      </section>

      {/* Team Invitations */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Team Invitations</h2>
        {/* InviteUsers here if desired */}
      </section>
    </main>
  )
}
