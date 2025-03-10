'use client'

import dynamic from 'next/dynamic'

const Sidebar = dynamic(() => import('@/components/dashboard/sidebar'), {
  ssr: false,
  loading: () => (
    <div className="w-64 bg-gray-200 animate-pulse" />
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
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-white px-6 flex items-center justify-end">
          <UserNav />
        </header>
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
} 