'use client'

import { useParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const projectId = params?.projectId as string

  useEffect(() => {
    console.log('Project layout mounted for ID:', projectId)
    console.log('Current pathname:', pathname)
    
    // Check URL for direct access - only apply this check if we're actually in the dashboard/projects path
    // Don't redirect when in hybrid-project or other paths
    if (pathname && projectId && pathname.startsWith('/dashboard/projects/')) {
      const expectedPath = `/dashboard/projects/${projectId}`
      // Only redirect if we're on a malformed dashboard/projects path
      if (pathname !== expectedPath && !pathname.includes('/hybrid-project/')) {
        console.log('Pathname mismatch in dashboard context, fixing navigation')
        window.location.href = expectedPath
      } else {
        console.log('Pathname matches expected format')
      }
    }
  }, [pathname, projectId])

  return (
    <div className="project-layout">
      {children}
    </div>
  )
} 