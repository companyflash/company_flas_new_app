//app/(app)/layout.tsx

'use client'
import '/globals.css'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useState, type ReactNode } from 'react'
import { Header } from '@/app/(app)/components/Header'
import { Sidebar } from '@/app/(app)/components/Sidebar'

export default function AppLayout({ children }: { children: ReactNode }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <Header />
      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SessionContextProvider>
  )
}
