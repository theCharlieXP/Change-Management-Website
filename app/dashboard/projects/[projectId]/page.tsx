'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Pencil, Check, X } from 'lucide-react'
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
  const { isLoaded, isSignedIn } = useAuth()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ProjectStatus>('planning')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const projectData = await getProject(projectId)
        if (!projectData) {
          setError('Project not found')
          return
        }

        const tasksData = await getProjectTasks(projectId)
        
        setProject(projectData)
        setTasks(tasksData)
        setStatus(projectData.status)
        setEditTitle(projectData.title)
        setEditDescription(projectData.description || '')
      } catch (err) {
        console.error('Error loading project data:', err)
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Failed to load project data')
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectId, isLoaded, isSignedIn, router])

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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error || 'Project not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => router.push('/dashboard/projects')}
        className="hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      {/* Project Title and Status */}
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
                  setEditTitle(project?.title || '')
                  setEditDescription(project?.description || '')
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{project?.title}</h1>
              {project?.description && (
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
        tasks={tasks}
        projectId={projectId}
        onAdd={handleAddTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* Saved Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No insights saved to this project yet</p>
          </div>
        </CardContent>
      </Card>

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