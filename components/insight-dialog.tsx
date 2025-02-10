'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { type Insight } from '@/types/insights'
import { BookmarkPlus } from 'lucide-react'

interface InsightDialogProps {
  insight: Insight
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export function InsightDialog({ insight, isOpen, onClose, onSave }: InsightDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{insight.category}</span>
            <span>•</span>
            <span>{new Date(insight.created_at).toLocaleDateString()}</span>
          </div>
          <DialogTitle className="text-xl">{insight.title}</DialogTitle>
          <DialogDescription className="text-base">
            {insight.summary}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
          <span className="flex items-center gap-1">
            <span className="font-medium">{insight.readTime}</span> read
          </span>
          <span>•</span>
          <span>Source: {insight.source}</span>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          {insight.content.map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {insight.tags && insight.tags.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              {insight.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onSave && onSave()}
          >
            <BookmarkPlus className="w-4 h-4" />
            Save to Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 