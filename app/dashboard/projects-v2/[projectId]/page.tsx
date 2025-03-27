'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, ListTodo, FileText, Edit, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Project, ProjectTask, ProjectNote } from '@/types/projects'
import { getProject, getProjectTasks, getProjectNotes } from '@/lib/supabase'

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

// Task status display mapping
const TASK_STATUS_COLORS = {
  'todo': 'bg-gray-100 text-gray-800 border-gray-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'blocked': 'bg-red-100 text-red-800 border-red-200',
  'completed': 'bg-green-100 text-green-800 border-green-200'
} as const

const TASK_STATUS_LABELS = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'blocked': 'Blocked',
  'completed': 'Completed'
} as const

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const projectId = params.projectId
  
  // State
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Load project data
  useEffect(() => {
    async function loadProjectData() {
      if (!user) return
      
      setLoading(true)
      console.log('Project V2 details: Loading data for project:', projectId)
      
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
        
        console.log('Project V2 details: Successfully loaded project data', {
          project: projectData.title,
          tasksCount: tasksData?.length || 0,
          notesCount: notesData?.length || 0
        })
      } catch (err) {
        console.error('Error loading project data:', err)
        setError('Failed to load project data')
      } finally {
        setLoading(false)
      }
    }
    
    loadProjectData()
  }, [projectId, user])
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error || !project) {
    return (
      <div className="bg-white border rounded-lg">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Project</h2>
          <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
          <Link href="/dashboard/projects-v2">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Project header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects-v2">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="flex items-center mt-1">
              <Badge className={`${STATUS_COLORS[project.status]} mr-2`}>
                {STATUS_LABELS[project.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Last updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
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
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('tasks')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-start gap-2 pb-3 border-b last:border-0 last:pb-0">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={task.status === 'completed'}
                          readOnly
                        />
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${TASK_STATUS_COLORS[task.status]} text-xs px-2 py-0.5`}>
                              {TASK_STATUS_LABELS[task.status]}
                            </Badge>
                            {task.due_date && (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(task.due_date), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No tasks yet</p>
                    <Button variant="link" size="sm" className="mt-2" onClick={() => setActiveTab('tasks')}>
                      Add your first task
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
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('notes')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {notes.length > 0 ? (
                  <div className="space-y-4">
                    {notes.slice(0, 2).map((note) => (
                      <div key={note.id} className="pb-3 border-b last:border-0 last:pb-0">
                        <p className="line-clamp-3 text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(note.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No notes yet</p>
                    <Button variant="link" size="sm" className="mt-2" onClick={() => setActiveTab('notes')}>
                      Add your first note
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tasks</CardTitle>
                <Button size="sm">
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={task.status === 'completed'}
                        readOnly
                      />
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`${TASK_STATUS_COLORS[task.status]} text-xs px-2 py-0.5`}>
                            {TASK_STATUS_LABELS[task.status]}
                          </Badge>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No tasks have been added to this project yet.</p>
                  <Button>Add your first task</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notes</CardTitle>
                <Button size="sm">
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notes.length > 0 ? (
                <div className="space-y-6">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(note.created_at), 'MMM d, yyyy')}
                        </span>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No notes have been added to this project yet.</p>
                  <Button>Add your first note</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 