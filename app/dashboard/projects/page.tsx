'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import type { Project } from '@/types/projects'
import { useUser } from '@clerk/nextjs'
import { getProjects } from '@/lib/supabase'
import { ProjectCard } from './project-card'

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
            <ProjectCard 
              key={project.id} 
              project={project} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectsPage 