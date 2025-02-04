'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ExternalLink, BookmarkPlus, X } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { cn } from '@/lib/utils'
import type { InsightFocusArea } from '@/app/dashboard/insights/page'

interface InsightModalProps {
  insight: {
    id: string
    title: string
    summary: string
    source: string
    focusArea: InsightFocusArea
  }
  focusAreaInfo: {
    label: string
    color: string
  }
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, notes: string) => void
}

export function InsightModal({ insight, focusAreaInfo, isOpen, onClose, onSave }: InsightModalProps) {
  const [notes, setNotes] = useState('')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {insight.title}
              </h2>
              <Badge className={cn("shrink-0", focusAreaInfo.color)}>
                {focusAreaInfo.label}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="prose max-w-none mb-6">
            {insight.summary.split('\n').map((point, index) => (
              <div key={index} className="flex items-start gap-2 mt-2">
                <span className="text-muted-foreground">•</span>
                <p className="mt-0 mb-0">{point.replace(/^[•-]\s*/, '')}</p>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              placeholder="Add your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href={insight.source} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Full article
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onSave(insight.id, notes)}
              >
                <BookmarkPlus className="h-4 w-4 mr-1" />
                Save with notes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 