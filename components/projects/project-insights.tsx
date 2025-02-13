'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { ExternalLink, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { SavedInsight } from '@/types/insights'

interface ProjectInsightsProps {
  insights: SavedInsight[]
  isLoading?: boolean
}

export function ProjectInsights({ insights, isLoading = false }: ProjectInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<SavedInsight | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
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
    <>
      <div className="space-y-2">
        {insights.map((insight) => (
          <div 
            key={insight.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-border/80 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => setSelectedInsight(insight)}
          >
            <h3 className="font-medium text-sm truncate flex-1">{insight.title}</h3>
            <Badge 
              variant="secondary"
              className={cn(
                INSIGHT_FOCUS_AREAS[insight.focus_area].color,
                "ml-4 whitespace-nowrap text-xs"
              )}
            >
              {INSIGHT_FOCUS_AREAS[insight.focus_area].label}
            </Badge>
          </div>
        ))}
      </div>

      <Dialog open={selectedInsight !== null} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        {selectedInsight && (
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between pr-8">
                <div className="flex items-center gap-4">
                  <DialogTitle>{selectedInsight.title}</DialogTitle>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      INSIGHT_FOCUS_AREAS[selectedInsight.focus_area].color,
                      "whitespace-nowrap"
                    )}
                  >
                    {INSIGHT_FOCUS_AREAS[selectedInsight.focus_area].label}
                  </Badge>
                </div>
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Insight content */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Summary</h4>
                  <div className="space-y-2 text-sm">
                    {selectedInsight.summary.split('\n').map((point, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{point.replace(/^[•-]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                  {selectedInsight.url && (
                    <Button variant="outline" size="sm" asChild className="mt-4">
                      <a href={selectedInsight.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Source
                      </a>
                    </Button>
                  )}
                </div>

                {/* Notes section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Notes</h4>
                  {selectedInsight.additional_notes ? (
                    <p className="text-sm whitespace-pre-wrap">{selectedInsight.additional_notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
} 