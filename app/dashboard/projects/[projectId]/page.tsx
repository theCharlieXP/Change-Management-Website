'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  const [status, setStatus] = useState(project?.status || 'planning')

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
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Created {format(new Date(project.created_at), 'MMM d, yyyy')}
          </span>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={`w-[180px] ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`}>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea placeholder="Add a new task..." className="w-full" />
            <Button>Add Task</Button>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No tasks added yet</p>
            </div>
          </div>
        </CardContent>
      </Card>

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