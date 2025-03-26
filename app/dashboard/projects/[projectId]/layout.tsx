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
    
    // Check URL for direct access
    if (pathname && projectId) {
      const expectedPath = `/dashboard/projects/${projectId}`
      if (pathname !== expectedPath) {
        console.log('Pathname mismatch, fixing navigation')
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