'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { InsightFocusArea } from '@/types/insights'

interface InsightSummary {
  id: string
  title: string
  content: string
  notes: string | null
  focus_area: InsightFocusArea
  created_at: string
  updated_at: string
}

interface ProjectSummariesProps {
  summaries: InsightSummary[]
  isLoading?: boolean
}

export function ProjectSummaries({ summaries, isLoading = false }: ProjectSummariesProps) {
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null)

  const toggleSummary = (id: string) => {
    setExpandedSummaryId(expandedSummaryId === id ? null : id)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (summaries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No insight summaries saved to this project yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {summaries.map((summary) => (
        <Card 
          key={summary.id}
          className={cn(
            "transition-all duration-200",
            expandedSummaryId === summary.id ? "bg-muted/50" : ""
          )}
        >
          {/* Header - Always visible */}
          <div 
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => toggleSummary(summary.id)}
          >
            <div className="flex items-center gap-4">
              <h3 className="font-medium">{summary.title}</h3>
              <Badge 
                variant="secondary"
                className={cn(
                  INSIGHT_FOCUS_AREAS[summary.focus_area].color,
                  "whitespace-nowrap"
                )}
              >
                {INSIGHT_FOCUS_AREAS[summary.focus_area].label}
              </Badge>
            </div>
            <Button variant="ghost" size="icon">
              {expandedSummaryId === summary.id ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Expanded content */}
          {expandedSummaryId === summary.id && (
            <div className="px-4 pb-4 border-t pt-4">
              <div className="grid gap-8">
                {/* Summary content */}
                <div className="space-y-6">
                  {summary.content.split('\n\n').map((section, index) => {
                    const [heading, ...points] = section.split('\n')
                    return (
                      <div key={index} className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900">{heading}</h4>
                        <ul className="space-y-2">
                          {points.map((point, pointIndex) => (
                            <li key={pointIndex} className="text-sm text-gray-700 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{point.replace(/^[-•]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                {/* Notes section */}
                {summary.notes && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900">Notes</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{summary.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
} 