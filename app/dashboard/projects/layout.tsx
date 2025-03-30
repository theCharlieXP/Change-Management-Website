'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  // Detect if we're on a project detail page
  const isProjectDetailPage = pathname?.startsWith('/dashboard/projects/') && 
    pathname?.split('/').length > 3;
  
  useEffect(() => {
    if (isProjectDetailPage) {
      console.log('ProjectsLayout: Detail page detected, ensuring no redirects');
    }
  }, [isProjectDetailPage, pathname]);

  return (
    <div className="relative bg-background">
      {children}
    </div>
  )
} 