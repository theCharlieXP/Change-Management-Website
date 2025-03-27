'use client'

// Simple debug logging that won't interfere with normal page operation
if (typeof window !== 'undefined') {
  console.log('PROJECT DETAIL PAGE LOADED:', window.location.pathname);
  
  // Add a sentinel value to the window to detect if our component code executes
  (window as any).__PROJECT_PAGE_LOADED = true;
}

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, ArrowLeft, FileText, ListTodo, PlusCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@clerk/nextjs'
import type { Project, ProjectTask, ProjectNote } from '@/types/projects'
import { getProject, getProjectTasks, getProjectNotes } from '@/lib/supabase'
import { DebugWindow } from './debug-window'
import { FallbackLoader } from './fallback-loader'
import { TransitionDebug } from './transition-debug'

// Status display mapping
const STATUS_COLORS = {
  'planning': 'bg-blue-100 text-blue-800 border-blue-200',
  'inprogress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'onhold': 'bg-orange-100 text-orange-800 border-orange-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'cancelled': 'bg-red-100 text-red-800 border-red-200'
} as const

const STATUS_LABELS = {
  'planning': 'Planning',
  'inprogress': 'In Progress',
  'onhold': 'On Hold',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
} as const

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const { user } = useUser()
  const projectId = params.projectId

  // State
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [useFallback, setUseFallback] = useState(false)

  // Set a timeout to switch to fallback if main component doesn't load in time
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        console.log('Switching to fallback loader due to timeout');
        setUseFallback(true);
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(fallbackTimer);
  }, [loading]);

  // Load project data
  useEffect(() => {
    async function loadProjectData() {
      if (!user) return
      
      setLoading(true)
      console.log('Project details: Loading data for project:', projectId);
      
      try {
        // Load project
        const projectData = await getProject(projectId)
        if (!projectData) {
          setError('Project not found')
          return
        }
        setProject(projectData)
        
        // Load tasks
        const tasksData = await getProjectTasks(projectId)
        setTasks(tasksData || [])
        
        // Load notes
        const notesData = await getProjectNotes(projectId)
        setNotes(notesData || [])
        
        console.log('Project details: Successfully loaded project data', {
          project: projectData.title,
          tasksCount: tasksData?.length || 0,
          notesCount: notesData?.length || 0
        });
      } catch (err) {
        console.error('Error loading project data:', err)
        setError('Failed to load project data')
      } finally {
        setLoading(false)
      }
    }
    
    loadProjectData()
  }, [projectId, user])
  
  // If we're in fallback mode, render the fallback loader
  if (useFallback) {
    return (
      <>
        <DebugWindow />
        <TransitionDebug />
        <FallbackLoader projectId={projectId} />
      </>
    );
  }
  
  // Go back to projects list
  const goBack = () => {
    window.location.href = '/dashboard/projects';
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <DebugWindow />
        <TransitionDebug />
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
      <div className="container mx-auto py-8">
        <DebugWindow />
        <TransitionDebug />
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
              <Button onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <DebugWindow />
      <TransitionDebug />
      {/* Project header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="flex items-center mt-1">
              <Badge className={`${STATUS_COLORS[project.status]} mr-2`}>
                {STATUS_LABELS[project.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {format(new Date(project.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">Edit Project</Button>
        </div>
      </div>
      
      {/* Project description */}
      {project.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Project tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="insights">Insights (0)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent tasks */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <ListTodo className="mr-2 h-5 w-5 text-muted-foreground" />
                    Recent Tasks
                  </CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-start gap-2 pb-2 border-b">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={task.status === 'completed'}
                          readOnly
                        />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Added {format(new Date(task.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No tasks yet</p>
                    <Button variant="link" size="sm" className="mt-2">
                      <PlusCircle className="h-4 w-4 mr-1" /> 
                      Add Your First Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent notes */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                    Recent Notes
                  </CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                {notes.length > 0 ? (
                  <div className="space-y-4">
                    {notes.slice(0, 2).map((note) => (
                      <div key={note.id} className="p-3 bg-muted rounded-md">
                        <p className="line-clamp-3 text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Added {format(new Date(note.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No notes yet</p>
                    <Button variant="link" size="sm" className="mt-2">
                      <PlusCircle className="h-4 w-4 mr-1" /> 
                      Add Your First Note
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Tasks</CardTitle>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 pb-3 border-b">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={task.status === 'completed'}
                        readOnly
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{task.title}</p>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">Edit</Button>
                            <Button variant="ghost" size="sm">Delete</Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Added {format(new Date(task.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-4">No tasks yet</p>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Your First Task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Notes</CardTitle>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notes.length > 0 ? (
                <div className="space-y-6">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between mb-2">
                        <p className="text-xs text-muted-foreground">
                          Added {format(new Date(note.created_at), 'MMM d, yyyy')}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm">Delete</Button>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-4">No notes yet</p>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Your First Note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">No insights linked to this project yet</p>
                <Button>Browse Insights</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 