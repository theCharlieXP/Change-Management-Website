'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { SavedInsight } from '@/types/insights'

interface ProjectInsightsProps {
  insights: SavedInsight[]
  isLoading?: boolean
}

export function ProjectInsights({ insights, isLoading = false }: ProjectInsightsProps) {
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null)

  const toggleInsight = (id: string) => {
    setExpandedInsightId(expandedInsightId === id ? null : id)
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

  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No insights saved to this project yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <Card 
          key={insight.id}
          className={cn(
            "transition-all duration-200",
            expandedInsightId === insight.id ? "bg-muted/50" : ""
          )}
        >
          {/* Header - Always visible */}
          <div 
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => toggleInsight(insight.id)}
          >
            <div className="flex items-center gap-4">
              <h3 className="font-medium">{insight.title}</h3>
              <Badge 
                variant="secondary"
                className={cn(
                  INSIGHT_FOCUS_AREAS[insight.focus_area].color,
                  "whitespace-nowrap"
                )}
              >
                {INSIGHT_FOCUS_AREAS[insight.focus_area].label}
              </Badge>
            </div>
            <Button variant="ghost" size="icon">
              {expandedInsightId === insight.id ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Expanded content */}
          {expandedInsightId === insight.id && (
            <div className="px-4 pb-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Insight content */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Summary</h4>
                  <div className="space-y-2 text-sm">
                    {insight.summary.split('\n').map((point, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{point.replace(/^[•-]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                  {insight.url && (
                    <Button variant="outline" size="sm" asChild className="mt-4">
                      <a href={insight.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Source
                      </a>
                    </Button>
                  )}
                </div>

                {/* Notes section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Notes</h4>
                  {insight.additional_notes ? (
                    <p className="text-sm whitespace-pre-wrap">{insight.additional_notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
} 