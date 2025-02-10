'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/components/ui/link'
import { cn } from '@/lib/utils'
import type { Insight } from '@/types/insights'

interface InsightModalProps {
  insight: Insight
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export function InsightModal({ insight, isOpen, onClose, onSave }: InsightModalProps) {
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
        </DialogHeader>

        <div className="mt-4">
          <p className="text-base text-muted-foreground">{insight.summary}</p>
        </div>

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
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </>
        )}

        {onSave && (
          <div className="mt-6 flex justify-end">
            <Button onClick={onSave} variant="outline" size="sm">
              Save to Project
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 