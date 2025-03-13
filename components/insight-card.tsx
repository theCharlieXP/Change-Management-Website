'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { ExternalLink, BookmarkPlus } from "lucide-react"
import { InsightFocusArea } from "@/types/insights"
import { SaveToProjectDialog } from "./save-to-project-dialog"
import type { Project } from '@prisma/client'

interface InsightCardProps {
  title: string
  description: string
  summary: string
  url?: string
  focusArea: InsightFocusArea
  insight: any // Using any temporarily, should be properly typed
}

export function InsightCard({ 
  title, 
  description, 
  summary, 
  url = '', 
  focusArea,
  insight
}: InsightCardProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  
  const formatFocusArea = (area: InsightFocusArea) => {
    return area.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <>
      <Card className="w-full transition-all hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold line-clamp-2">{title}</CardTitle>
              <CardDescription className="mt-2 line-clamp-2">{description}</CardDescription>
            </div>
            {focusArea && (
              <Badge variant="outline" className="shrink-0">
                {formatFocusArea(focusArea)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            {summary.split('\n').map((point, index) => {
              const cleanPoint = point.replace(/^[-•]\s*/, '').trim()
              if (!cleanPoint) return null
              
              return (
                <p key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span className="flex-1">{cleanPoint}</span>
                </p>
              )
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Source
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsSaveDialogOpen(true)}
          >
            <BookmarkPlus className="mr-2 h-4 w-4" />
            Save to Project
          </Button>
        </CardFooter>
      </Card>

      <SaveToProjectDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        insight={insight}
        isLoading={false}
      />
    </>
  )
} 