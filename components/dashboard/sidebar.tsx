'use client'

import Link from "next/link"
import { Brain, Handshake, UserCircle, MessageSquare, Sparkles, Wrench } from "lucide-react"
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname() || ''
  
  const sidebarItems = [
    {
      name: "Insights",
      href: "/dashboard/insights",
      icon: Brain,
      matchPaths: ['/dashboard/insights']
    },
    {
      name: "Custom DeepSeek",
      href: "/dashboard/custom-deepseek",
      icon: Wrench,
      matchPaths: ['/dashboard/custom-deepseek']
    },
    {
      name: "Communications",
      href: "/dashboard/communications",
      icon: MessageSquare,
      matchPaths: ['/dashboard/communications']
    },
    {
      name: "Mystery Feature",
      href: "/dashboard/mystery-feature",
      icon: Sparkles,
      matchPaths: ['/dashboard/mystery-feature']
    },
    {
      name: "Account",
      href: "/dashboard/account",
      icon: UserCircle,
      matchPaths: ['/dashboard/account']
    },
  ]

  return (
    <div className="flex flex-col gap-2 p-4">
      {sidebarItems.map((item) => {
        const Icon = item.icon
        const isActive = item.matchPaths.some(path => {
          if (path.includes('[')) {
            const pattern = path.replace(/\[.*?\]/g, '([^/]+)')
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
                : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </div>
  )
} 