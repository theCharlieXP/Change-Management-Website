import { auth } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import dynamic from 'next/dynamic'

const Sidebar = dynamic(() => import('@/components/dashboard/sidebar').then(mod => mod.Sidebar), {
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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

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