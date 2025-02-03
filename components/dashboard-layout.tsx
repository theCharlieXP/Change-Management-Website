'use client'

import { UserButton } from "@clerk/nextjs"
import { FolderKanban, Brain } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const sidebarItems = [
    {
      name: "Projects",
      href: "/dashboard/projects",
      icon: FolderKanban,
      matchPaths: ['/dashboard/projects', '/dashboard/projects/[projectId]']
    },
    {
      name: "Insights",
      href: "/dashboard/insights",
      icon: Brain,
      matchPaths: ['/dashboard/insights']
    },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="h-16 flex items-center gap-2 px-4 border-b">
          <div className="w-3 h-3 bg-emerald-500 rounded-full" />
          <Link href="/" className="text-xl font-semibold">
            Change Buddy
          </Link>
        </div>
        
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = item.matchPaths.some(path => {
              if (path.includes('[')) {
                // Convert [projectId] to regex pattern
                const pattern = path.replace(/\[.*?\]/g, '[^/]+')
                return new RegExp(`^${pattern}$`).test(pathname)
              }
              return pathname === path
            })
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-white px-6 flex items-center justify-end">
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "hover:ring-2 hover:ring-emerald-600 transition-all",
              }
            }}
          />
        </header>
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
} 