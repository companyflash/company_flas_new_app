'use client';
import '/globals.css';

import { type ReactNode } from 'react';
import { Header } from '@/app/(app)/components/Header';
import { Sidebar } from '@/app/(app)/components/Sidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </>
  );
}
