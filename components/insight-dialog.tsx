'use client'

import { Clock, Link as LinkIcon, Tag, BookmarkPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { type Insight } from '@/app/dashboard/insights/page'

interface InsightDialogProps {
  insight: Insight
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (insightId: string) => Promise<void>
}

export function InsightDialog({ insight, open, onOpenChange, onSave }: InsightDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{insight.category.name}</span>
            <span>•</span>
            <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
          </div>
          <DialogTitle className="text-2xl">{insight.title}</DialogTitle>
          <DialogDescription className="text-base">
            {insight.summary}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{insight.readTime} min read</span>
          </div>
          {insight.source && (
            <a 
              href={insight.source} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Source</span>
            </a>
          )}
        </div>

        <Separator />

        {/* Content */}
        <div className="prose prose-emerald max-w-none">
          {insight.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex flex-col gap-4">
          {insight.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-muted-foreground" />
              {insight.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onSave(insight.id)}
            >
              <BookmarkPlus className="w-4 h-4" />
              Save to Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 