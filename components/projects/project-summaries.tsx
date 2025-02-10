'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { X, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InsightSummary, InsightFocusArea } from '@/types/insights'

interface ProjectSummariesProps {
  summaries: InsightSummary[]
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

export function ProjectSummaries({ summaries }: ProjectSummariesProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      // await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy content:', error)
    }
  }

  if (!summaries.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insight Summaries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No summaries generated yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insight Summaries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className="flex flex-col gap-2 p-4 rounded-lg border bg-card"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-medium">{summary.title}</h3>
              <Badge className={cn("shrink-0", INSIGHT_FOCUS_AREAS[summary.focus_area].color)}>
                {INSIGHT_FOCUS_AREAS[summary.focus_area].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{summary.content}</p>
            <div className="text-xs text-muted-foreground">
              Generated on {new Date(summary.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 