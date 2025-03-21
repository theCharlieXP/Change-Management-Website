import Link from "next/link"
import { usePathname } from 'next/navigation'
import { FolderKanban, Brain, MessageSquare, UserCircle, Sparkles } from "lucide-react"

export default function MobileNav() {
  const pathname = usePathname()
  
  const navItems = [
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
    {
      name: "Communications",
      href: "/dashboard/communications",
      icon: MessageSquare,
      matchPaths: ['/dashboard/communications']
    },
    {
      name: "Mystery",
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
    <nav className="flex items-center justify-around px-2 h-14 bg-white">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.matchPaths.some(path => {
          if (path.includes('[')) {
            const pattern = path.replace(/\[.*?\]/g, '[^/]+')
            return new RegExp(`^${pattern}$`).test(pathname)
          }
          return pathname === path
        })

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isActive 
                ? "text-emerald-600" 
                : "text-gray-600 hover:text-emerald-600"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
} 