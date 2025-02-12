'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Pencil, Check, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@clerk/nextjs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { Project, ProjectStatus, ProjectTask } from '@/types/projects'
import { getProject, updateProject, getProjectTasks, createProjectTask, updateProjectTask, deleteProjectTask } from '@/lib/supabase'
import { ProjectTasks } from '@/components/projects/project-tasks'
import { ProjectInsights } from '@/components/projects/project-insights'
import { toast } from '@/components/ui/use-toast'
import type { SavedInsight } from '@/types/insights'

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

    const fetchProjectData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${params.projectId}`)
        if (!projectResponse.ok) {
          if (projectResponse.status === 401) {
            router.push('/sign-in')
            return
          }
          throw new Error('Failed to fetch project')
        }
        const projectData = await projectResponse.json()
        setProject(projectData)

        // Fetch project insights
        const insightsResponse = await fetch(`/api/projects/${params.projectId}/insights`)
        if (!insightsResponse.ok) {
          throw new Error('Failed to fetch insights')
        }
        const insightsData = await insightsResponse.json()
        setInsights(insightsData)

        const tasksData = await getProjectTasks(projectId)
        
        setTasks(tasksData)
        setStatus(projectData.status)
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

    fetchProjectData()
  }, [isLoaded, isSignedIn, userId, params.projectId, projectId, router])

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

      {/* Project Header */}
      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          {project.description && (
            <CardDescription>{project.description}</CardDescription>
          )}
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

      {/* Project Details */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          {isEditing ? (
            <div className="flex-1 space-y-4">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-3xl font-bold h-auto py-1"
                placeholder="Project title"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full"
                placeholder="Project description"
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={!editTitle.trim()}>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="ghost" onClick={() => {
                  setIsEditing(false)
                  setEditTitle(project.title)
                  setEditDescription(project.description || '')
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              {project.description && (
                <p className="mt-2 text-muted-foreground">{project.description}</p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="mt-2"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Created {format(new Date(project?.created_at || ''), 'MMM d, yyyy')}
          </span>
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

      {/* Tasks Section */}
      <ProjectTasks
        projectId={project.id}
        tasks={tasks}
        onAdd={handleAddTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* Insight Summaries Section */}
      <Card>
        <CardHeader>
          <CardTitle>Insight Summaries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No summaries generated yet</p>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Add your project notes here..." 
            className="w-full min-h-[200px]"
          />
        </CardContent>
      </Card>
    </div>
  )
} 