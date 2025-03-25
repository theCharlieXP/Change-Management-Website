'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Pencil, Check, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@clerk/nextjs'
import type { InsightSummary } from '@/types/insights'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { Project, ProjectStatus, ProjectTask, ProjectNote } from '@/types/projects'
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
import { ProjectNotes } from '@/components/projects/project-notes'
import { toast } from '@/components/ui/use-toast'
import { ProjectSummaries } from '@/components/projects/project-summaries'
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog'

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
  const projectId = params?.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ProjectStatus>('planning')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
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

    if (!projectId) {
      setError('Invalid project ID')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [projectRes, notesRes, tasksRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/notes`),
          fetch(`/api/projects/${projectId}/tasks`)
        ])

        if (!projectRes.ok) {
          if (projectRes.status === 404) {
            setError('Project not found')
            setLoading(false)
            return
          }
          if (projectRes.status === 401) {
            setError('Please sign in to view projects')
            setLoading(false)
            router.push('/sign-in')
            return
          }
          throw new Error('Failed to fetch project data')
        }

        if (!notesRes.ok || !tasksRes.ok) {
          throw new Error('Failed to fetch project data')
        }

        const [projectData, notesData, tasksData] = await Promise.all([
          projectRes.json(),
          notesRes.json(),
          tasksRes.json()
        ])

        setProject(projectData)
        setNotes(notesData)
        setTasks(tasksData)
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
  }, [isLoaded, isSignedIn, userId, projectId, router])

  useEffect(() => {
    const fetchSummaries = async () => {
      if (!projectId) return

      try {
        const response = await fetch(`/api/projects/${projectId}/summaries`)
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
  }, [projectId])

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
        title: editTitle
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

  const handleReorderTasks = async (reorderedTasks: ProjectTask[]) => {
    try {
      // Optimistically update the UI
      setTasks(reorderedTasks)

      const response = await fetch(`/api/projects/${projectId}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: reorderedTasks }),
      })

      if (!response.ok) {
        // Revert on error
        setTasks(tasks)
        const errorData = await response.json()
        console.error('Task reordering failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          tasks: reorderedTasks
        })
        throw new Error(errorData.details || 'Failed to reorder tasks')
      }
    } catch (error) {
      console.error('Error reordering tasks:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        tasks: reorderedTasks
      })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reorder tasks",
        variant: "destructive"
      })
    }
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

  const handleUpdateNotes = async (summaryId: string, notes: string) => {
    try {
      await handleUpdateNote(summaryId, { content: notes })
      toast({
        title: "Success",
        description: "Notes updated successfully"
      })
    } catch (error) {
      console.error('Error updating notes:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update notes',
        variant: "destructive"
      })
    }
  }

  const handleDeleteSummary = async (summaryId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/summaries`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: summaryId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete summary')
      }

      // Update the summaries state by removing the deleted summary
      setSummaries(prev => prev.filter(summary => summary.id !== summaryId))
    } catch (error) {
      console.error('Error deleting summary:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete summary",
        variant: "destructive"
      })
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
        <Button onClick={() => router.push('/dashboard/projects')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    )
  }

  const projectName = project?.title || 'Project'
  const projectDescription = project?.description
  const projectStatus = project?.status || 'not_started'

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/projects')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {isEditing ? (
              <div className="flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold mb-2"
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{projectName}</h1>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  <Badge className={STATUS_COLORS[status]}>
                    {STATUS_LABELS[status]}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <Badge className={STATUS_COLORS[value as ProjectStatus]}>
                      {label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="pt-6">
          <ProjectTasks
            tasks={tasks}
            projectId={projectId}
            onAdd={handleAddTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            onReorder={handleReorderTasks}
          />
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Insight Summaries</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectSummaries
            summaries={summaries}
            isLoading={summariesLoading}
            onUpdateNotes={handleUpdateNotes}
            onDelete={handleDeleteSummary}
          />
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Project Notes</CardTitle>
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

      {/* Delete Project Section */}
      <DeleteProjectDialog projectId={projectId} projectTitle={project.title} />
    </div>
  )
} 