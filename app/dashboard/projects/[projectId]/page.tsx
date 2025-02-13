'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Pencil, Check, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@clerk/nextjs'
import type { SavedInsight, InsightSummary } from '@/types/insights'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { Project, ProjectStatus, ProjectTask, ProjectNote, ProjectInsight } from '@/types/projects'
import { 
  getProject, 
  updateProject, 
  getProjectTasks, 
  createProjectTask, 
  updateProjectTask, 
  deleteProjectTask,
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote
} from '@/lib/supabase'
import { ProjectTasks } from '@/components/projects/project-tasks'
import { ProjectInsights } from '@/components/projects/project-insights'
import { ProjectNotes } from '@/components/projects/project-notes'
import { toast } from '@/components/ui/use-toast'
import { ProjectSummaries } from '@/components/projects/project-summaries'

const STATUS_COLORS = {
  'planning': 'text-blue-600 bg-blue-50',
  'inprogress': 'text-yellow-600 bg-yellow-50',
  'onhold': 'text-orange-600 bg-orange-50',
  'completed': 'text-green-600 bg-green-50',
  'cancelled': 'text-red-600 bg-red-50'
} as const

const STATUS_LABELS = {
  'planning': 'Planning',
  'inprogress': 'In Progress',
  'onhold': 'On Hold',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
} as const

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoaded, isSignedIn, userId } = useAuth()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ProjectStatus>('planning')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [insights, setInsights] = useState<SavedInsight[]>([])
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [summaries, setSummaries] = useState<InsightSummary[]>([])
  const [summariesLoading, setSummariesLoading] = useState(true)

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

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [projectRes, notesRes, tasksRes, insightsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/notes`),
          fetch(`/api/projects/${projectId}/tasks`),
          fetch(`/api/projects/${projectId}/insights`)
        ])

        if (!projectRes.ok || !notesRes.ok || !tasksRes.ok || !insightsRes.ok) {
          throw new Error('Failed to fetch project data')
        }

        const [projectData, notesData, tasksData, insightsData] = await Promise.all([
          projectRes.json(),
          notesRes.json(),
          tasksRes.json(),
          insightsRes.json()
        ])

        setProject(projectData)
        setNotes(notesData)
        setTasks(tasksData)
        setInsights(insightsData)
        setStatus(projectData.status || 'planning')
        setEditTitle(projectData.title)
        setEditDescription(projectData.description || '')
      } catch (error) {
        console.error('Error fetching project data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load project')
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load project data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isLoaded, isSignedIn, userId, params.projectId, projectId, router])

  useEffect(() => {
    const fetchSummaries = async () => {
      if (!params.projectId) return

      try {
        const response = await fetch(`/api/projects/${params.projectId}/summaries`)
        if (!response.ok) {
          throw new Error('Failed to fetch summaries')
        }
        const data = await response.json()
        setSummaries(data)
      } catch (error) {
        console.error('Error fetching summaries:', error)
        toast({
          title: "Error",
          description: "Failed to load summaries",
          variant: "destructive"
        })
      } finally {
        setSummariesLoading(false)
      }
    }

    fetchSummaries()
  }, [params.projectId, toast])

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    try {
      const updatedProject = await updateProject(projectId, { status: newStatus })
      setProject(updatedProject)
      setStatus(newStatus)
    } catch (err) {
      console.error('Error updating project status:', err)
      // Revert status on error
      setStatus(project?.status || 'planning')
    }
  }

  const handleSaveEdit = async () => {
    if (!project) return

    try {
      const updatedProject = await updateProject(projectId, {
        title: editTitle,
        description: editDescription
      })
      setProject(updatedProject)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating project:', err)
    }
  }

  const handleAddTask = async (task: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>) => {
    const newTask = await createProjectTask(projectId, task)
    setTasks((prev) => [newTask, ...prev])
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<ProjectTask>) => {
    const updatedTask = await updateProjectTask(taskId, updates)
    setTasks((prev) => prev.map((task) => 
      task.id === taskId ? updatedTask : task
    ))
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteProjectTask(taskId)
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const handleAddNote = async (note: { content: string }): Promise<ProjectNote> => {
    const response = await fetch(`/api/projects/${projectId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: note.content }),
    });

    if (!response.ok) {
      throw new Error('Failed to add note');
    }

    const newNote: ProjectNote = await response.json();
    setNotes((prev) => [...prev, newNote]);
    return newNote;
  };

  const handleUpdateNote = async (id: string, note: { content: string }): Promise<ProjectNote> => {
    const response = await fetch(`/api/projects/${projectId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: note.content }),
    });

    if (!response.ok) {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      });
      throw new Error('Failed to update note');
    }

    const updatedNote: ProjectNote = await response.json();
    // Maintain the order when updating
    setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));
    return updatedNote;
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteProjectNote(projectId, noteId)
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/dashboard/projects')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      {/* Project Details */}
      <Card>
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-3xl font-bold h-auto py-2 px-3"
                      placeholder="Project Title"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveEdit}
                        disabled={!editTitle.trim()}
                        size="sm"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false)
                          setEditTitle(project?.title || '')
                        }}
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold mb-2">{project?.title}</CardTitle>
                    <CardDescription className="text-base">{project?.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="ml-6">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className={`w-[180px] ${STATUS_COLORS[status]}`}>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="inprogress">In Progress</SelectItem>
                  <SelectItem value="onhold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Project Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Insights</CardTitle>
          <CardDescription>
            Insights and research saved to this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectInsights insights={insights} isLoading={loading} />
        </CardContent>
      </Card>

      {/* Insight Summaries */}
      <Card>
        <CardHeader>
          <CardTitle>Insight Summaries</CardTitle>
          <CardDescription>
            Generated summaries of search results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectSummaries summaries={summaries} isLoading={summariesLoading} />
        </CardContent>
      </Card>

      {/* Tasks and Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              Track and manage project tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectTasks
              tasks={tasks}
              projectId={projectId}
              onAdd={handleAddTask}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
            />
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Project Notes</CardTitle>
            <CardDescription>
              Keep track of ideas, thoughts, and important information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectNotes
              notes={notes}
              projectId={projectId}
              onAdd={handleAddNote}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 