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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" hideCloseButton>
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
              {insight.summary.split('\n').map((point, index) => {
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
              })}
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