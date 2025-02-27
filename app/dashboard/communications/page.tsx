'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, FileText, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@clerk/nextjs'
import type { Project } from '@/types/projects'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'

export default function CommunicationsPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch projects when auth is ready
  useEffect(() => {
    let isMounted = true
    
    const fetchProjects = async () => {
      // Skip if auth isn't ready
      if (!isLoaded) {
        console.log('Auth not loaded yet, waiting...')
        return
      }

      // Skip if not signed in
      if (!isSignedIn) {
        console.log('User not signed in, skipping project fetch')
        setLoading(false)
        return
      }

      try {
        console.log('Auth ready, fetching projects...')
        setLoading(true)

        const response = await fetch('/api/projects')
        
        // Handle response
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Project fetch failed:', { 
            status: response.status, 
            statusText: response.statusText,
            errorData 
          })
          throw new Error(errorData.details || 'Failed to fetch projects')
        }

        const data = await response.json()
        console.log('Successfully fetched projects:', data)
        
        if (isMounted) {
          setProjects(data)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
        if (isMounted) {
          setLoading(false)
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load projects. Please try refreshing the page.",
            variant: "destructive"
          })
        }
      }
    }

    fetchProjects()

    return () => {
      isMounted = false
    }
  }, [isLoaded, isSignedIn, toast])

  const handleProjectChange = (value: string) => {
    setSelectedProject(value)
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Communications Amigo</h1>
        <p className="text-muted-foreground">
          Create and manage communications for your change management projects
        </p>
      </div>

      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border">
        {/* Left panel - white background */}
        <div className="w-1/3 bg-white p-6 border-r overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Select a Project</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a project to create communications for
            </p>
            
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length > 0 ? (
              <Select onValueChange={handleProjectChange} value={selectedProject || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No projects available</p>
                <CreateProjectDialog 
                  onProjectCreated={(newProject) => {
                    setProjects(prev => [newProject, ...prev])
                    setSelectedProject(newProject.id)
                  }} 
                />
              </div>
            )}
          </div>

          {selectedProject && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Communication Types</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Email Template</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Announcement</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Send className="mr-2 h-4 w-4" />
                  <span>Stakeholder Update</span>
                </Button>
              </div>
              <div className="pt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Coming Soon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      The Communications Amigo feature is currently in development. 
                      Soon you'll be able to create AI-assisted communications for your change projects.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Right panel - gray background */}
        <div className="w-2/3 bg-gray-50 p-6 overflow-y-auto">
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-medium mb-2">Communications Assistant</h3>
              <p className="text-muted-foreground mb-6">
                Select a project and communication type from the left panel to get started.
                Our AI will help you craft effective communications for your change management initiatives.
              </p>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Feature Preview</CardTitle>
                  <CardDescription>Coming soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The Communications Amigo will help you create:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                    <li>Stakeholder communications</li>
                    <li>Change announcements</li>
                    <li>Project updates</li>
                    <li>Training materials</li>
                    <li>And more...</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 