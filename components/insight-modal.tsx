'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/components/ui/link'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { BookmarkPlus, Loader2, ExternalLink } from 'lucide-react'
import { SaveToProjectDialog } from '@/components/save-to-project-dialog'
import type { Insight } from '@/types/insights'
import type { Project } from '@prisma/client'
import { format } from 'date-fns'

interface InsightModalProps {
  insight: Insight
  isOpen: boolean
  onClose: () => void
  isProjectsLoading: boolean
}

export function InsightModal({
  insight,
  isOpen,
  onClose,
  isProjectsLoading
}: InsightModalProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle>{insight.title}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{insight.category}</Badge>
            <span>•</span>
            <time dateTime={insight.created_at}>
              {format(new Date(insight.created_at), 'MMM d, yyyy')}
            </time>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary bullet points */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {insight.summary.split('\n').map((point, index) => (
              <div key={index} className="flex items-start gap-2">
                <span>•</span>
                <span>{point.replace(/^[•-]\s*/, '')}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Notes section */}
          <div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes about this insight..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(true)}
              disabled={isProjectsLoading}
            >
              {isProjectsLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading projects...
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Save to Project
                </>
              )}
            </Button>
            {insight.url && (
              <Button variant="outline" asChild>
                <Link href={insight.url} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Source
                </Link>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <SaveToProjectDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        insight={{
          ...insight,
          notes
        }}
        isLoading={isProjectsLoading}
      />
    </Dialog>
  )
} 