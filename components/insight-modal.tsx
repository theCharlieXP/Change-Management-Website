'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/components/ui/link'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { BookmarkPlus, Loader2, ExternalLink, X } from 'lucide-react'
import { SaveToProjectDialog } from '@/components/save-to-project-dialog'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { Insight } from '@/types/insights'

interface InsightModalProps {
  insight: Insight & { notes?: string }
  isOpen: boolean
  onClose: () => void
  isProjectsLoading: boolean
  isSummary?: boolean
}

export function InsightModal({ insight, isOpen, onClose, isProjectsLoading, isSummary = false }: InsightModalProps) {
  const [notes, setNotes] = useState(insight.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save logic here
      setShowSaveDialog(true)
    } catch (error) {
      console.error('Error saving insight:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-md"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <DialogHeader className="pr-6">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle>{insight.title}</DialogTitle>
              <Badge className={cn("shrink-0", INSIGHT_FOCUS_AREAS[insight.focus_area].color)}>
                {INSIGHT_FOCUS_AREAS[insight.focus_area].label}
              </Badge>
            </div>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Content */}
            <div className="space-y-4">
              {isSummary ? (
                // For summaries, handle the structured format with sections
                <>
                  {insight.summary.split('\n\n').map((section, sectionIndex) => {
                    // Check if this is a section header
                    const lines = section.split('\n');
                    const sectionHeader = lines[0];
                    const sectionContent = lines.slice(1);
                    
                    // Skip the title as it's already shown above
                    if (sectionIndex === 0) return null;
                    
                    return (
                      <div key={`section-${sectionIndex}`} className="space-y-2">
                        <h4 className="text-sm font-medium">{sectionHeader}</h4>
                        <div className="space-y-2">
                          {sectionContent.map((point, pointIndex) => {
                            const cleanPoint = point.replace(/^[-•]\s*/, '').trim();
                            if (!cleanPoint) return null;
                            
                            // Special handling for References section to make links clickable
                            if (sectionHeader === "References (with links)" || sectionHeader === "References") {
                              // Try multiple patterns to extract URLs
                              const standardUrlMatch = cleanPoint.match(/\s*-\s*(https?:\/\/[^\s]+)$/);
                              
                              if (standardUrlMatch) {
                                const url = standardUrlMatch[1]; // Get the captured URL
                                // Get everything before the URL (source name)
                                const sourceName = cleanPoint.substring(0, cleanPoint.indexOf(' - ')).trim();
                                
                                return (
                                  <div key={`point-${pointIndex}`} className="flex items-start gap-2">
                                    <span className="text-muted-foreground">•</span>
                                    <span className="flex-1 text-sm">
                                      {sourceName} - <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{url}</a>
                                    </span>
                                  </div>
                                );
                              }
                              
                              // Also try to find any URL in the text if the standard format fails
                              const anyUrlMatch = cleanPoint.match(/(https?:\/\/[^\s]+)/);
                              if (anyUrlMatch) {
                                const url = anyUrlMatch[1];
                                // Remove the URL from the text to get the source name
                                const textWithoutUrl = cleanPoint.replace(url, '').trim();
                                const sourceName = textWithoutUrl.replace(/\s*-\s*$/, '').trim() || 'Source';
                                
                                return (
                                  <div key={`point-${pointIndex}`} className="flex items-start gap-2">
                                    <span className="text-muted-foreground">•</span>
                                    <span className="flex-1 text-sm">
                                      {sourceName} <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{url}</a>
                                    </span>
                                  </div>
                                );
                              }
                            }
                            
                            // Enhanced display for Key Findings, Patterns & Implications, and Practical Applications
                            if (
                              sectionHeader === "Key Findings" || 
                              sectionHeader === "Patterns & Implications" || 
                              sectionHeader === "Practical Applications"
                            ) {
                              return (
                                <div key={`point-${pointIndex}`} className="flex items-start gap-2">
                                  <span className="text-primary font-bold">•</span>
                                  <p className="text-sm text-foreground flex-1">{cleanPoint}</p>
                                </div>
                              );
                            }
                            
                            // Default rendering for other sections
                            return (
                              <div key={`point-${pointIndex}`} className="flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <p className="text-sm text-foreground flex-1">{cleanPoint}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                // For regular insights, use the existing simple format
                insight.summary.split('\n').map((point, index) => {
                  const cleanPoint = point.replace(/^[-•]\s*/, '').trim()
                  if (!cleanPoint) return null
                  
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-muted-foreground leading-tight">•</span>
                      <p className="text-sm text-foreground flex-1">
                        {cleanPoint}
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notes</h4>
              <Textarea
                placeholder="Add your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {insight.url && (
              <Button variant="outline" asChild className="mr-auto">
                <Link href={insight.url} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Source
                </Link>
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || isProjectsLoading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  Save to Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSaveDialog && (
        <SaveToProjectDialog
          open={showSaveDialog}
          onOpenChange={(open) => {
            setShowSaveDialog(open)
            if (!open) onClose()
          }}
          insight={{
            ...insight,
            notes
          }}
          isLoading={isProjectsLoading}
          isSummary={isSummary}
        />
      )}
    </>
  )
} 