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
    
    // IMPORTANT: Previously, there was redirect code here that was causing issues
    // The redirect functionality has been completely removed to fix navigation problems
  }, [pathname, projectId])

  return (
    <div className="project-layout">
      {children}
    </div>
  )
} 