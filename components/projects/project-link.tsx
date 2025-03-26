'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProjectLinkProps {
  projectId: string
  className?: string
  children?: React.ReactNode
}

export function ProjectLink({ projectId, className, children }: ProjectLinkProps) {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('ProjectLink: Navigating to project:', projectId);
    router.push(`/hybrid-project/${projectId}`);
  }
  
  return (
    <a 
      href={`/hybrid-project/${projectId}`}
      className={`inline-flex items-center text-sm font-medium text-primary hover:underline ${className || ''}`}
      onClick={handleClick}
    >
      {children || (
        <>
          View Project <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </a>
  )
} 