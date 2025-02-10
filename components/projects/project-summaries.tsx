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
              <Badge className={cn("shrink-0", FOCUS_AREAS[summary.focus_area].color)}>
                {FOCUS_AREAS[summary.focus_area].label}
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