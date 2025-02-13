'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { X, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { InsightSummary } from '@/types/insights'
import { toast } from '@/components/ui/use-toast'

interface ProjectSummariesProps {
  summaries: InsightSummary[]
  isLoading?: boolean
  onUpdateNotes?: (id: string, notes: string) => Promise<void>
}

export function ProjectSummaries({ summaries, isLoading = false, onUpdateNotes }: ProjectSummariesProps) {
  const [selectedSummary, setSelectedSummary] = useState<InsightSummary | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveNotes = async () => {
    if (!selectedSummary || !onUpdateNotes) return
    
    setIsSaving(true)
    try {
      await onUpdateNotes(selectedSummary.id, notes)
      setIsEditingNotes(false)
      toast({
        title: "Success",
        description: "Notes updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatContent = (content: string) => {
    const sections = content.split('\n\n')
    return sections.map(section => {
      const lines = section.split('\n')
      const heading = lines[0]
      const points = lines.slice(1).map(point => point.replace(/^[•-]\s*/, '').trim()).filter(Boolean)
      return { heading, points }
    }).filter(section => section.heading && section.points.length > 0)
  }

  // Reset notes when summary changes
  const handleSummarySelect = (summary: InsightSummary) => {
    setSelectedSummary(summary)
    setNotes(summary.notes || '')
    setIsEditingNotes(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (summaries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No summaries generated yet.
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {summaries.map((summary) => (
          <div 
            key={summary.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-border/80 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => handleSummarySelect(summary)}
          >
            <h3 className="font-medium text-sm truncate flex-1">{summary.title}</h3>
            <Badge 
              variant="secondary"
              className={cn(
                INSIGHT_FOCUS_AREAS[summary.focus_area].color,
                "ml-4 whitespace-nowrap text-xs"
              )}
            >
              {INSIGHT_FOCUS_AREAS[summary.focus_area].label}
            </Badge>
          </div>
        ))}
      </div>

      <Dialog open={selectedSummary !== null} onOpenChange={(open) => !open && setSelectedSummary(null)}>
        {selectedSummary && (
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between pr-8">
                <div className="flex items-center gap-4">
                  <DialogTitle>{selectedSummary.title}</DialogTitle>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      INSIGHT_FOCUS_AREAS[selectedSummary.focus_area].color,
                      "whitespace-nowrap"
                    )}
                  >
                    {INSIGHT_FOCUS_AREAS[selectedSummary.focus_area].label}
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
                {formatContent(selectedSummary.content).map((section, index) => (
                  <div key={index} className="space-y-3">
                    <h4 className="font-medium text-sm">{section.heading}</h4>
                    <ul className="space-y-2 list-disc pl-4">
                      {section.points.map((point, pointIndex) => (
                        <li key={pointIndex} className="text-sm text-muted-foreground">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Notes section */}
                <div className="border-t pt-6 mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Notes</h4>
                    {!isEditingNotes ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setIsEditingNotes(true)}
                      >
                        Edit Notes
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingNotes(false)
                            setNotes(selectedSummary.notes || '')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add your notes here..."
                      className="min-h-[100px]"
                    />
                  ) : notes ? (
                    <p className="text-sm whitespace-pre-wrap">{notes}</p>
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