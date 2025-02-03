'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { X, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectSummary } from '@/types/projects'
import type { InsightFocusArea } from '@/types/insights'

interface ProjectSummariesProps {
  summaries: ProjectSummary[]
  onDelete: (id: string) => Promise<void>
}

const INSIGHT_FOCUS_AREAS: Record<InsightFocusArea, { label: string, color: string }> = {
  'challenges-barriers': {
    label: 'Challenges & Barriers',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  'strategies-solutions': {
    label: 'Strategies & Solutions',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'outcomes-results': {
    label: 'Outcomes & Results',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  'stakeholders-roles': {
    label: 'Key Stakeholders & Roles',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  'best-practices': {
    label: 'Best Practices',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  'lessons-learned': {
    label: 'Lessons Learned',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  'implementation-tactics': {
    label: 'Implementation Tactics',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  'communication-engagement': {
    label: 'Communication & Engagement',
    color: 'bg-pink-100 text-pink-800 border-pink-200'
  },
  'metrics-performance': {
    label: 'Metrics & Performance',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200'
  },
  'risk-management': {
    label: 'Risk Management',
    color: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  'technology-tools': {
    label: 'Technology & Tools',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  'cultural-transformation': {
    label: 'Cultural Transformation',
    color: 'bg-violet-100 text-violet-800 border-violet-200'
  },
  'change-leadership': {
    label: 'Change Leadership',
    color: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  'employee-training': {
    label: 'Employee Training',
    color: 'bg-lime-100 text-lime-800 border-lime-200'
  },
  'change-sustainability': {
    label: 'Change Sustainability',
    color: 'bg-teal-100 text-teal-800 border-teal-200'
  }
}

export function ProjectSummaries({ summaries, onDelete }: ProjectSummariesProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
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

  return (
    <div className="space-y-4">
      {summaries.map((summary) => (
        <Card key={summary.id} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => handleDelete(summary.id)}
            disabled={deletingId === summary.id}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader>
            <div className="flex items-start gap-2">
              <Badge className={cn("shrink-0", INSIGHT_FOCUS_AREAS[summary.focus_area].color)}>
                {INSIGHT_FOCUS_AREAS[summary.focus_area].label}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => handleCopy(summary.content, summary.id)}
              >
                {copiedId === summary.id ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {summary.notes && (
                <div className="bg-muted p-3 rounded-md mb-4">
                  <p className="text-sm text-muted-foreground">{summary.notes}</p>
                </div>
              )}
              {summary.content.split('\n').map((point, index) => (
                <div key={index} className="flex items-start gap-2 mt-2">
                  <span className="text-muted-foreground">•</span>
                  <p className="mt-0 mb-0">{point.replace(/^[•-]\s*/, '')}</p>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              Created {new Date(summary.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 