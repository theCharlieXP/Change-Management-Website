'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import type { Project } from '@/types/projects'
import { useUser } from '@clerk/nextjs'
import { getProjects } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

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

const ProjectsPage = () => {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProjects() {
      if (!user) return
      try {
        console.log('Projects page: Loading projects for user:', user.id);
        setLoading(true)
        const data = await getProjects(user.id)
        console.log('Projects page: Successfully loaded', data.length, 'projects');
        setProjects(data)
      } catch (err) {
        console.error('Error loading projects:', err)
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [user])

  const addProject = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev])
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">
          Manage and track your change management projects
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <CreateProjectDialog onProjectCreated={addProject} />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet. Click the &quot;Create Project&quot; button above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <a 
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              // IMPORTANT: use browser native navigation, no onClick handlers
              className="block transition-transform hover:scale-[1.02]"
            >
              <Card 
                className="h-[140px] sm:h-[160px] cursor-pointer"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-sm sm:text-base font-medium flex-1 line-clamp-2">
                      {project.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div>Created {format(new Date(project.created_at), 'MMM d, yyyy')}</div>
                      <div>Last edited {format(new Date(project.updated_at), 'MMM d, yyyy')}</div>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge className={`${STATUS_COLORS[project.status]} text-xs px-2 py-0.5 whitespace-nowrap`}>
                      {STATUS_LABELS[project.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectsPage 