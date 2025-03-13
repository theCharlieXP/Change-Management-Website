'use client'

import dynamic from 'next/dynamic'
import { Handshake } from "lucide-react"

const Sidebar = dynamic(() => import('@/components/dashboard/sidebar'), {
  ssr: false,
  loading: () => (
    <div className="hidden md:block w-64 bg-gray-200 animate-pulse" />
  )
})

const MobileNav = dynamic(() => import('@/components/dashboard/mobile-nav'), {
  ssr: false,
  loading: () => (
    <div className="h-14 bg-gray-200 animate-pulse md:hidden" />
  )
})

const UserNav = dynamic(() => import('@/components/user-nav').then(mod => mod.UserNav), {
  ssr: false,
  loading: () => (
    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
  )
})

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Navigation Header */}
      <div className="md:hidden border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Handshake className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-lg font-semibold text-emerald-600">
              Change Amigo
            </span>
          </div>
          <UserNav />
        </div>
        <MobileNav />
      </div>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b bg-white px-4 md:px-6 items-center justify-end">
          <UserNav />
        </header>
        <main className="flex-1 p-4 md:p-6 bg-gray-50 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
} 