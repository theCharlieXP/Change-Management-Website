'use client'

import { ArrowRight } from 'lucide-react'

interface ProjectLinkProps {
  projectId: string
  className?: string
  children?: React.ReactNode
}

export function ProjectLink({ projectId, className, children }: ProjectLinkProps) {
  // Use a simple direct HTML link for maximum reliability
  return (
    <a 
      href={`/project-view/${projectId}`}
      className={`inline-flex items-center text-sm font-medium text-primary hover:underline ${className || ''}`}
    >
      {children || (
        <>
          View Project <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </a>
  )
} 