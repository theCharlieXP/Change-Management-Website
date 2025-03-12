'use client'

import dynamic from 'next/dynamic'

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
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white px-4 md:px-6 flex items-center justify-between">
          <div className="md:hidden">
            {/* Empty div to maintain spacing */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 md:p-6 bg-gray-50 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
} 