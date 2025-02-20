'use client'

import Link from "next/link"
import { FolderKanban, Brain, Handshake } from "lucide-react"
import { usePathname } from 'next/navigation'

export default function Sidebar() {
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
    <aside className="w-64 bg-white border-r">
      <style jsx>{`
        @keyframes handshake {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-10deg) translateY(-2px); }
          50% { transform: rotate(0deg) translateY(0); }
          75% { transform: rotate(10deg) translateY(-2px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .handshake-hover:hover {
          animation: handshake 0.5s ease-in-out infinite;
        }
      `}</style>
      <div className="h-16 flex items-center justify-center gap-2 px-4 border-b group">
          <div className="relative handshake-hover">
            <Handshake 
              className="w-6 h-6 text-emerald-600 transition-colors duration-500
                group-hover:text-emerald-500" 
            />
          </div>
          <span className="text-xl font-semibold text-emerald-600 transition-colors duration-500 group-hover:text-emerald-500">
            Change Amigo
          </span>
      </div>
      
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = item.matchPaths.some(path => {
            if (path.includes('[')) {
              // Convert [projectId] to regex pattern
              const pattern = path.replace(/\[.*?\]/g, '[^/]+')
              return new RegExp(`^${pattern}$`).test(pathname)
            }
            return pathname === path
          })

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
  )
} 