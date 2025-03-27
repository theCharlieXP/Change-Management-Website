'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Project, ProjectTask, ProjectNote } from '@/types/projects'

// This is a simplified version of the hybrid project page
// that bypasses any potential route conflicts or redirects
export default function DirectProjectViewPage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId
  
  // State
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // IMPORTANT: Direct data loading without any router usage
  useEffect(() => {
    console.log('DirectProjectView: Loading data for project ID:', projectId)
    
    // This function fetches data without relying on any router features
    async function fetchData() {
      try {
        setLoading(true)
        console.log('DirectProjectView: Fetching data from API')
        
        // Use the dedicated static data route that bypasses client-side auth issues
        const apiUrl = `/static-project-data/${projectId}`
        console.log('DirectProjectView: API URL:', apiUrl)
        
        const response = await fetch(apiUrl, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store',
          credentials: 'include'
        })
        
        console.log('DirectProjectView: Response received', { 
          status: response.status,
          ok: response.ok
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to load project')
        }
        
        const data = await response.json()
        console.log('DirectProjectView: Data fetched successfully', {
          hasProject: !!data.project,
          taskCount: data.tasks?.length,
          noteCount: data.notes?.length
        })
        
        // Set data in state
        setProject(data.project)
        setTasks(data.tasks || [])
        setNotes(data.notes || [])
        setError(null)
      } catch (err) {
        console.error('DirectProjectView: Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    
    // Fetch data immediately
    fetchData()
  }, [projectId])
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">Loading Project</h2>
            <p className="text-gray-500">Please wait while we load your project data...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error || !project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Project</h2>
              <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
              <a href="/dashboard/projects" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Project view
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <a 
          href="/dashboard/projects"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </a>
        <h1 className="text-2xl font-bold">{project.title}</h1>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="mb-4">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {project.status || 'planning'}
          </span>
          <div className="mt-4 text-sm text-gray-500">
            <div>Created {format(new Date(project.created_at), 'PPP')}</div>
            <div>Last updated {format(new Date(project.updated_at), 'PPP')}</div>
          </div>
        </div>
        
        {project.description && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-gray-700">{project.description}</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7">
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Tasks</h2>
            {tasks && tasks.length > 0 ? (
              <ul className="space-y-3">
                {tasks.map(task => (
                  <li key={task.id} className="flex items-start gap-2 py-2 border-b">
                    <input 
                      type="checkbox" 
                      checked={task.status === 'completed'} 
                      readOnly
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-gray-500">
                        Added {format(new Date(task.created_at), 'PPP')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No tasks added yet.</p>
            )}
            
            <a 
              href={`/dashboard/projects/${projectId}`}
              className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Go to Interactive Project Page
            </a>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            {notes && notes.length > 0 ? (
              <div className="space-y-4">
                {notes.map(note => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      Added {format(new Date(note.created_at), 'PPP')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No notes added yet.</p>
            )}
          </div>
        </div>
        
        <div className="md:col-span-5">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <a 
                href={`/dashboard/projects/${projectId}`}
                className="block w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-center"
              >
                Edit Project
              </a>
              <a 
                href="/dashboard/projects"
                className="block w-full py-2 px-4 border border-gray-300 rounded-md text-center hover:bg-gray-50"
              >
                Back to Projects
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 