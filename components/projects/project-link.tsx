'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface ProjectLinkProps {
  projectId: string
  className?: string
  children?: React.ReactNode
}

export function ProjectLink({ projectId, className, children }: ProjectLinkProps) {
  const { isLoaded, user } = useUser()
  const [isChecking, setIsChecking] = useState(false)
  const [isAccessible, setIsAccessible] = useState<boolean | null>(null)

  // Check if the project is accessible when the component mounts
  useEffect(() => {
    if (!isLoaded || !user) return
    
    const checkProjectAccess = async () => {
      setIsChecking(true)
      try {
        const response = await fetch('/api/projects/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId }),
        })
        
        const data = await response.json()
        setIsAccessible(!!data.exists)
      } catch (error) {
        console.error('Error checking project access:', error)
        setIsAccessible(false)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkProjectAccess()
  }, [projectId, isLoaded, user])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isAccessible === false) {
      toast({
        title: "Cannot access project",
        description: "This project doesn't exist or you don't have permission to access it.",
        variant: "destructive",
      })
      return
    }
    
    // Use direct navigation for maximum reliability
    window.location.href = `/dashboard/projects/${projectId}`
  }

  return (
    <Button 
      variant="ghost" 
      className={className} 
      onClick={handleClick}
      disabled={isChecking || isAccessible === false}
    >
      {children || (
        <>
          View Project <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
} 