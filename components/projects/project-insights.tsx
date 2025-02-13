'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExternalLink, X, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { SavedInsight } from '@/types/insights'
import { toast } from '@/components/ui/use-toast'

interface ProjectInsightsProps {
  insights: SavedInsight[]
  isLoading?: boolean
  onDelete?: (id: string) => Promise<void>
}

export function ProjectInsights({ insights, isLoading = false, onDelete }: ProjectInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<SavedInsight | null>(null)
  const [insightToDelete, setInsightToDelete] = useState<SavedInsight | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!insightToDelete || !onDelete) {
      console.error('Missing insight to delete or onDelete handler');
      toast({
        title: "Error",
        description: "Unable to delete insight",
        variant: "destructive"
      });
      return;
    }

    if (!insightToDelete.id) {
      console.error('Invalid insight ID');
      toast({
        title: "Error",
        description: "Invalid insight ID",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(insightToDelete.id);
      setInsightToDelete(null);
      setSelectedInsight(null);
      insights = insights.filter(insight => insight.id !== insightToDelete.id);
      toast({
        title: "Success",
        description: "Insight deleted successfully",
      });
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast({
        title: "Error",
        description: "Failed to delete insight",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
              <div className="space-y-6">
                {/* Summary section */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Summary</h4>
                  <ul className="space-y-2 list-disc pl-4">
                    {selectedInsight.summary.split('\n').map((point, index) => (
                      <li key={index} className="text-sm">
                        {point.replace(/^[•-]\s*/, '')}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Notes section */}
                <div className="border-t pt-6 mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm">Additional Notes</h4>
                  </div>
                  {selectedInsight.additional_notes ? (
                    <p className="text-sm whitespace-pre-wrap">{selectedInsight.additional_notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added</p>
                  )}
                </div>

                {/* Source link */}
                {selectedInsight.url && (
                  <div className="border-t pt-6">
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedInsight.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Source
                      </a>
                    </Button>
                  </div>
                )}

                {/* Delete section */}
                <div className="border-t pt-6 mt-8">
                  <div className="flex flex-col items-start gap-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Danger Zone</h4>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setInsightToDelete(selectedInsight)
                      }}
                    >
                      Delete Insight
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={insightToDelete !== null} onOpenChange={(open) => !open && setInsightToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Insight</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this insight? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setInsightToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 