'use client'

import React from 'react'
import { useState } from 'react'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types/projects'
import { format } from 'date-fns'

const STATUS_COLORS = {
  'planning': 'bg-blue-100 text-blue-800 border-blue-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'cancelled': 'bg-red-100 text-red-800 border-red-200'
} as const

// Mock data for development
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Digital Transformation Initiative',
    description: 'Company-wide digital transformation project focusing on modernizing our core systems.',
    status: 'in-progress',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
    user_id: '1'
  },
  {
    id: '2',
    title: 'Employee Training Program',
    description: 'Implementing a new training program for all employees on the new systems.',
    status: 'planning',
    created_at: '2024-03-14T10:00:00Z',
    updated_at: '2024-03-14T10:00:00Z',
    user_id: '1'
  }
]

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)

  const addProject = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev])
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <CreateProjectDialog onProjectCreated={addProject} />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet</p>
          <CreateProjectDialog onProjectCreated={addProject} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link 
              key={project.id} 
              href={`/dashboard/projects/${project.id}`}
              className="block transition-transform hover:scale-[1.02]"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                    <Badge className={STATUS_COLORS[project.status]}>
                      {project.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Created {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                    <ArrowRight className="h-4 w-4" />
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

export default ProjectsPage 