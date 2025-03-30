'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Project } from '@/types/projects'
import { getProjects } from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createProject } from '@/lib/supabase'

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

export default function ProjectsV2Page() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    async function loadProjects() {
      if (!user) return
      try {
        console.log('Projects V2: Loading projects for user:', user.id)
        setLoading(true)
        const data = await getProjects(user.id)
        console.log('Projects V2: Successfully loaded', data.length, 'projects')
        setProjects(data)
      } catch (err) {
        console.error('Projects V2: Error loading projects:', err)
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [user])

  const handleCreateProject = async () => {
    if (!user || !newProjectTitle.trim()) return
    
    try {
      setIsCreating(true)
      const newProject = await createProject(user.id, newProjectTitle.trim())
      setProjects(prev => [newProject, ...prev])
      setNewProjectTitle('')
      setIsCreateDialogOpen(false)
    } catch (err) {
      console.error('Projects V2: Error creating project:', err)
      // Keep dialog open on error
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-500 font-medium text-lg mb-2">Something went wrong</p>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track your change management projects
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create new project</DialogTitle>
              <DialogDescription>
                Give your project a name to get started.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-title">Project title</Label>
                <Input
                  id="project-title"
                  placeholder="Enter project title"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  disabled={isCreating}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <h3 className="font-medium text-lg mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first project to get started with Change Amigo.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link 
              key={project.id}
              href={`/dashboard/projects-v2/${project.id}`}
              className="block transition-transform hover:scale-[1.02]"
              onClick={(e) => {
                e.preventDefault();
                console.log('Projects V2: Custom navigation to project:', project.id);
                
                // Use a more direct method of navigation to prevent any interference
                window.location.href = `/dashboard/projects-v2/${project.id}`;
              }}
            >
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium line-clamp-2">
                    {project.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div>Created {format(new Date(project.created_at), 'MMM d, yyyy')}</div>
                      <div>Last updated {format(new Date(project.updated_at), 'MMM d, yyyy')}</div>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={`${STATUS_COLORS[project.status]} text-xs px-2 py-0.5 whitespace-nowrap`}>
                      {STATUS_LABELS[project.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 