'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface ProjectLinkProps {
  projectId: string
  className?: string
  children?: React.ReactNode
}

export function ProjectLink({ projectId, className, children }: ProjectLinkProps) {
  // Use the project-view route for reliability
  return (
    <Button 
      variant="ghost" 
      className={className} 
      asChild
    >
      <a href={`/project-view/${projectId}`}>
        {children || (
          <>
            View Project <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </a>
    </Button>
  )
} 