'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth, useUser } from '@clerk/nextjs'
import type { Project, ProjectTask, ProjectNote } from '@/types/projects'
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from '@/components/ui/use-toast'

interface ProjectDetailsContainerProps {
  children: (props: {
    project: Project;
    tasks: ProjectTask[];
    notes: ProjectNote[];
    isLoading: boolean;
    refetch: () => Promise<void>;
  }) => React.ReactNode;
}

export function ProjectDetailsContainer({ children }: ProjectDetailsContainerProps) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const projectId = params?.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)

  console.log('ProjectDetailsContainer mounted for ID:', projectId, 'pathname:', pathname);

  const fetchData = async () => {
    if (!isLoaded || !isSignedIn || !userId || !projectId) {
      return
    }
    
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching project data for ID:', projectId)
      console.log('Auth state:', { 
        isLoaded, 
        isSignedIn, 
        userId,
        userObject: !!user
      })

      // Skip the check endpoint which may be failing
      // and go directly to the details endpoint
      const projectDataRes = await fetch(`/api/projects/${projectId}/details`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store'
      })
      
      console.log('Project details response status:', projectDataRes.status)

      if (!projectDataRes.ok) {
        const errorText = await projectDataRes.text()
        console.error('Project details error:', {
          status: projectDataRes.status,
          text: errorText
        })
        
        if (projectDataRes.status === 404) {
          setError('Project not found')
          setLoading(false)
          setDebugInfo({
            error: 'Project not found',
            status: projectDataRes.status,
            projectId,
            userId,
            responseText: errorText
          })
          return
        }
        
        if (projectDataRes.status === 401) {
          setError('Please sign in to view projects')
          setLoading(false)
          router.push('/sign-in')
          return
        }
        
        throw new Error(`Failed to fetch project data: ${projectDataRes.status} - ${errorText}`)
      }

      // Parse the response
      const responseData = await projectDataRes.json()
      console.log('Project details received:', responseData)
      
      const { project: projectData, tasks: tasksData, notes: notesData } = responseData

      // Set all data at once
      setProject(projectData)
      setTasks(tasksData || [])
      setNotes(notesData || [])
      setRetryCount(0)
      
    } catch (error) {
      console.error('Error fetching project data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load project')
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId,
        userId
      })
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load project data",
        variant: "destructive"
      })

      // Implement retry logic
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1)
        toast({
          title: "Retrying",
          description: `Retrying to fetch project data (attempt ${retryCount + 1})...`,
        })
        setTimeout(fetchData, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  // When auth state or project ID changes, fetch data
  useEffect(() => {
    if (!isLoaded) {
      console.log('Auth not loaded yet, waiting...')
      return
    }

    if (!isSignedIn || !userId) {
      console.log('User not signed in')
      setError('Please sign in to view projects')
      setLoading(false)
      router.push('/sign-in')
      return
    }

    if (!projectId) {
      setError('Invalid project ID')
      setLoading(false)
      return
    }

    fetchData()
  }, [isLoaded, isSignedIn, userId, projectId])

  // If there's an error or no project, show an error message
  if (error || (!project && !loading)) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error Loading Project</AlertTitle>
          <AlertDescription>
            {error || 'Project not found'}<br/>
            Project ID: {projectId}<br/>
            User ID: {userId || 'Not authenticated'}<br/>
            Path: {pathname}
          </AlertDescription>
        </Alert>
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
              <Button onClick={() => router.push('/dashboard/projects')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
              <Button onClick={fetchData} variant="outline" className="mt-4">
                Retry
              </Button>
              
              {debugInfo && (
                <div className="mt-8 text-left w-full">
                  <h3 className="text-sm font-semibold mb-2">Debug Information:</h3>
                  <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If loading, show a simple loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading project details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If we have project data, render the children function with the data
  return <>{children({ project: project!, tasks, notes, isLoading: loading, refetch: fetchData })}</>
} 