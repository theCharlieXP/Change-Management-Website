'use client'

import { useState, useEffect } from 'react'
import { useAuthenticatedSupabase } from '@/lib/supabase/hooks'
import type { Project, ProjectInsight, ProjectSummary, ProjectTask, ProjectNote } from '@/types/projects'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProjectTasks } from '@/components/projects/project-tasks'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

const STATUS_COLORS = {
  'planning': 'bg-blue-100 text-blue-800 border-blue-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'cancelled': 'bg-red-100 text-red-800 border-red-200'
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [error, setError] = useState<string | null>(null)

  const { supabase, loading: clientLoading } = useAuthenticatedSupabase()

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!supabase) return

      try {
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', params.projectId)
          .single()

        if (projectError) throw projectError
        setProject(projectData)

        // Fetch project tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', params.projectId)
          .order('created_at', { ascending: false })

        if (tasksError) throw tasksError
        setTasks(tasksData)

        // Fetch project notes
        const { data: notesData, error: notesError } = await supabase
          .from('project_notes')
          .select('*')
          .eq('project_id', params.projectId)
          .order('created_at', { ascending: false })

        if (notesError) throw notesError
        setNotes(notesData)

      } catch (error) {
        console.error('Error fetching project data:', error)
        setError('Failed to load project data')
      }
    }

    if (supabase) {
      fetchProjectData()

      // Set up real-time subscriptions
      const projectSubscription = supabase
        .channel('project-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${params.projectId}`
        }, (payload) => {
          if (payload.eventType === 'UPDATE') {
            setProject(payload.new as Project)
          }
        })
        .subscribe()

      const tasksSubscription = supabase
        .channel('tasks-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_tasks',
          filter: `project_id=eq.${params.projectId}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as ProjectTask, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === payload.new.id ? payload.new as ProjectTask : task
            ))
          }
        })
        .subscribe()

      const notesSubscription = supabase
        .channel('notes-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_notes',
          filter: `project_id=eq.${params.projectId}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes(prev => [payload.new as ProjectNote, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(note => note.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setNotes(prev => prev.map(note => 
              note.id === payload.new.id ? payload.new as ProjectNote : note
            ))
          }
        })
        .subscribe()

      return () => {
        projectSubscription.unsubscribe()
        tasksSubscription.unsubscribe()
        notesSubscription.unsubscribe()
      }
    }
  }, [supabase, params.projectId])

  const handleAddTask = async (task: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>) => {
    if (!supabase) return

    const { error } = await supabase
      .from('project_tasks')
      .insert([task])

    if (error) throw error
  }

  const handleUpdateTask = async (id: string, task: Partial<ProjectTask>) => {
    if (!supabase) return

    const { error } = await supabase
      .from('project_tasks')
      .update(task)
      .eq('id', id)

    if (error) throw error
  }

  const handleDeleteTask = async (id: string) => {
    if (!supabase) return

    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  if (clientLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">{error || 'Project not found'}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Project Header */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
                <p className="text-muted-foreground mb-4">{project.description}</p>
              </div>
              <Badge className={cn("shrink-0", STATUS_COLORS[project.status])}>
                {project.status.replace('-', ' ')}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Created {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Project Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Tasks */}
              <div className="bg-white rounded-lg border p-6">
                <ProjectTasks
                  tasks={tasks}
                  projectId={params.projectId}
                  onAdd={handleAddTask}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Project Notes */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Project Notes</h2>
                {notes.length === 0 ? (
                  <p className="text-muted-foreground">No notes added yet</p>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-muted p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 