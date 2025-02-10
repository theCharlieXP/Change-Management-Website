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

const INSIGHT_FOCUS_AREAS: Record<InsightFocusArea, { label: string, color: string }> = {
  'general': {
    label: 'General',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  'stakeholder-impact': {
    label: 'Stakeholder Impact',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'risk-assessment': {
    label: 'Risk Assessment',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  'communication': {
    label: 'Communication',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  'timeline': {
    label: 'Timeline',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  'resources': {
    label: 'Resources',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
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
              <Badge className={cn("shrink-0", INSIGHT_FOCUS_AREAS[insight.focus_area].color)}>
                {INSIGHT_FOCUS_AREAS[insight.focus_area].label}
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