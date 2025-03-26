'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'

export default function ProjectViewerPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoaded, isSignedIn, userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const projectId = params?.projectId as string

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    console.log('Project Viewer: Authenticated access for project:', projectId)
    
    // After a brief delay to ensure auth is fully loaded, redirect to the main project page
    const timer = setTimeout(() => {
      const targetUrl = `/dashboard/projects/${projectId}`
      window.location.href = targetUrl
    }, 500)
    
    return () => clearTimeout(timer)
  }, [isLoaded, isSignedIn, projectId, router])

  return (
    <div className="container mx-auto py-12">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Loading Project</h1>
        <p className="text-muted-foreground mb-6">Please wait while we prepare your project...</p>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/projects')}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    </div>
  )
} 