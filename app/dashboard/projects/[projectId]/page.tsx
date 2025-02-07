'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, ListTodo, MessageSquare, Lightbulb, Settings, Plus, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import type { Project } from '@/types/projects'

// Mock data for development
const MOCK_PROJECTS: Record<string, Project> = {
  '1': {
    id: '1',
    title: 'Digital Transformation Initiative',
    description: 'Company-wide digital transformation project focusing on modernizing our core systems.',
    status: 'in-progress',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
    user_id: '1'
  },
  '2': {
    id: '2',
    title: 'Employee Training Program',
    description: 'Implementing a new training program for all employees on the new systems.',
    status: 'planning',
    created_at: '2024-03-14T10:00:00Z',
    updated_at: '2024-03-14T10:00:00Z',
    user_id: '1'
  }
}

const STATUS_COLORS = {
  'planning': 'bg-blue-100 text-blue-800 border-blue-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'cancelled': 'bg-red-100 text-red-800 border-red-200'
} as const

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const project = MOCK_PROJECTS[projectId]

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Project Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard/projects')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
          <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
          <p className="text-muted-foreground mb-4">{project.description || 'No description'}</p>
          <div className="flex items-center gap-4">
            <Badge className={STATUS_COLORS[project.status]}>
              {project.status.replace('-', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {format(new Date(project.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Project Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <CalendarDays className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListTodo className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Lightbulb className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="notes">
            <MessageSquare className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">tasks created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">insights collected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">notes added</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your project's latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Tasks</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No tasks created yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Insights</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Insight
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No insights collected yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Notes</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No notes added yet</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 