'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@/types/projects'

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

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Simple function to navigate to the project details
  const navigateToProject = () => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    console.log('ProjectCard: Navigating to project details:', project.id);
    
    // Use simple URL navigation with a full page load
    window.location.href = `/dashboard/projects/${project.id}`;
  };
  
  return (
    <Card 
      className={`h-[140px] sm:h-[160px] transition-transform hover:scale-[1.02] cursor-pointer ${isNavigating ? 'opacity-70' : ''}`}
      onClick={navigateToProject}
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
          {isNavigating && (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 