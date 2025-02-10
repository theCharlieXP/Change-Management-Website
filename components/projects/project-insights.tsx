'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ExternalLink, BookmarkPlus, X } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { cn } from '@/lib/utils'
import type { InsightFocusArea } from '@/types/insights'

interface ProjectInsightsProps {
  insights: Array<{
    id: string
    title: string
    summary: string
    focus_area: InsightFocusArea
    created_at: string
  }>
  onDelete: (id: string) => Promise<void>
}

const FOCUS_AREAS: Record<InsightFocusArea, { label: string; color: string }> = {
  'challenges-barriers': { 
    label: 'Challenges & Barriers',
    color: 'bg-red-100 text-red-800'
  },
  'strategies-solutions': { 
    label: 'Strategies & Solutions',
    color: 'bg-blue-100 text-blue-800'
  },
  'outcomes-results': { 
    label: 'Outcomes & Results',
    color: 'bg-green-100 text-green-800'
  },
  'key-stakeholders-roles': { 
    label: 'Key Stakeholders & Roles',
    color: 'bg-purple-100 text-purple-800'
  },
  'best-practices-methodologies': { 
    label: 'Best Practices & Methodologies',
    color: 'bg-yellow-100 text-yellow-800'
  },
  'lessons-learned-insights': { 
    label: 'Lessons Learned & Insights',
    color: 'bg-orange-100 text-orange-800'
  },
  'implementation-tactics': { 
    label: 'Implementation Tactics',
    color: 'bg-emerald-100 text-emerald-800'
  },
  'communication-engagement': { 
    label: 'Communication & Engagement',
    color: 'bg-indigo-100 text-indigo-800'
  },
  'metrics-performance': { 
    label: 'Metrics & Performance',
    color: 'bg-pink-100 text-pink-800'
  },
  'risk-management': { 
    label: 'Risk Management',
    color: 'bg-rose-100 text-rose-800'
  },
  'technology-tools': { 
    label: 'Technology & Tools',
    color: 'bg-cyan-100 text-cyan-800'
  },
  'cultural-transformation': { 
    label: 'Cultural Transformation',
    color: 'bg-teal-100 text-teal-800'
  },
  'change-leadership': { 
    label: 'Change Leadership',
    color: 'bg-violet-100 text-violet-800'
  },
  'employee-training': { 
    label: 'Employee Training',
    color: 'bg-fuchsia-100 text-fuchsia-800'
  },
  'change-sustainability': { 
    label: 'Change Sustainability',
    color: 'bg-sky-100 text-sky-800'
  }
}

export function ProjectInsights({ insights, onDelete }: ProjectInsightsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (!insights.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No insights saved to this project yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex flex-col gap-2 p-4 rounded-lg border bg-card"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-medium">{insight.title}</h3>
              <Badge className={cn("shrink-0", FOCUS_AREAS[insight.focus_area].color)}>
                {FOCUS_AREAS[insight.focus_area].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{insight.summary}</p>
            <div className="text-xs text-muted-foreground">
              Saved on {new Date(insight.created_at).toLocaleDateString()}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => handleDelete(insight.id)}
              disabled={deletingId === insight.id}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 