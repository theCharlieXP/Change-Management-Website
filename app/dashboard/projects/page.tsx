'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/projects'
import { DashboardLayout } from '@/components/dashboard-layout'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS = {
  'planning': 'bg-blue-100 text-blue-800 border-blue-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'cancelled': 'bg-red-100 text-red-800 border-red-200'
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useUser()
  const supabase = createClient()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!user) return

        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setProjects(data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()

    // Set up real-time subscription
    const projectsSubscription = supabase
      .channel('projects-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProjects(prev => [payload.new as Project, ...prev])
        } else if (payload.eventType === 'DELETE') {
          setProjects(prev => prev.filter(project => project.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setProjects(prev => prev.map(project => 
            project.id === payload.new.id ? payload.new as Project : project
          ))
        }
      })
      .subscribe()

    return () => {
      projectsSubscription.unsubscribe()
    }
  }, [user, supabase])

  if (!user) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <p>Please log in to view projects</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Projects</h1>
          <CreateProjectDialog />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-muted-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground">Click the "New Project" button above to create your first project</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                key={project.id} 
                href={`/dashboard/projects/${project.id}`}
                className="block transition-all duration-200 hover:shadow-lg"
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                      <Badge className={STATUS_COLORS[project.status]}>
                        {project.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 