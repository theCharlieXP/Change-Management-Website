'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/components/ui/link'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { BookmarkPlus } from 'lucide-react'
import { SaveToProjectDialog } from '@/components/save-to-project-dialog'
import type { Insight } from '@/types/insights'
import type { Project } from '@prisma/client'

interface InsightModalProps {
  insight: Insight
  projects: Project[]
  isOpen: boolean
  onClose: () => void
}

export function InsightModal({ insight, projects, isOpen, onClose }: InsightModalProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{insight.title}</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{insight.category}</Badge>
              <span>•</span>
              <span>{insight.readTime} read</span>
              <span>•</span>
              <span>Source: {insight.source}</span>
            </div>
          </DialogHeader>

          {/* Summary Bullet Points */}
          <div className="mt-4 space-y-2">
            {insight.summary.split('\n').map((point, index) => (
              <p key={index} className="text-base flex items-start gap-2">
                {point}
              </p>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Notes Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              placeholder="Add your notes about this insight..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={insight.source} target="_blank" className="gap-2">
                View Source
              </Link>
            </Button>
            <Button
              onClick={() => setIsSaveDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <BookmarkPlus className="w-4 h-4" />
              Save to Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SaveToProjectDialog
        insight={{
          ...insight,
          notes
        }}
        projects={projects}
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
      />
    </>
  )
} 