'use client'

import { ArrowRight } from 'lucide-react'

interface ProjectLinkProps {
  projectId: string
  className?: string
  children?: React.ReactNode
}

export function ProjectLink({ projectId, className, children }: ProjectLinkProps) {
  // Use the hybrid project page route for maximum reliability
  return (
    <a 
      href={`/hybrid-project/${projectId}`}
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